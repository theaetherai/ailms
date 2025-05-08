import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import ChatInterface from '@/components/ai-tutor/chat-interface'
import { getPreviewVideo } from '@/actions/workspace'
import { client } from '@/lib/prisma'

export default async function AiTutorPage({
  searchParams
}: {
  searchParams: { 
    videoId?: string,
    courseId?: string,
    lessonId?: string
  }
}) {
  // Ensure user is authenticated
  const user = await currentUser()
  if (!user) {
    redirect('/auth/sign-in')
  }

  // Get videoId from search params
  const videoId = searchParams.videoId ? searchParams.videoId.trim() : undefined;
  const courseId = searchParams.courseId ? searchParams.courseId.trim() : undefined;
  const lessonId = searchParams.lessonId ? searchParams.lessonId.trim() : undefined;
  
  // Clean the videoId to prevent issues with malformed IDs
  const cleanedVideoId = videoId ? videoId.replace(/[^a-zA-Z0-9-]/g, '') : undefined;
  
  // Log for debugging
  if (videoId && videoId !== cleanedVideoId) {
    console.log('[AI_TUTOR_PAGE] Cleaned videoId:', { original: videoId, cleaned: cleanedVideoId });
  }
  
  // Get video title if videoId exists
  let videoTitle: string | undefined = undefined;
  
  if (cleanedVideoId) {
    try {
      const videoData = await getPreviewVideo(cleanedVideoId);
      if (videoData.status === 200 && videoData.data) {
        videoTitle = videoData.data.title || undefined;
      } else {
        console.error('[AI_TUTOR_PAGE] Error fetching video data:', videoData);
      }
    } catch (error) {
      console.error('[AI_TUTOR_PAGE] Error fetching video data:', error);
    }
  }

  // Determine the return URL (course lesson URL or preview URL)
  const returnUrl = courseId && lessonId 
    ? `/courses/${courseId}/lessons/${lessonId}` 
    : `/preview/${cleanedVideoId}`;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        {cleanedVideoId && videoTitle && (
          <div className="mb-4">
            <Link href={returnUrl}>
              <Button variant="ghost" className="flex items-center gap-2 px-0 text-[#9D9D9D] hover:text-white">
                <ArrowLeft size={16} />
                <span>Back to video: {videoTitle}</span>
              </Button>
            </Link>
          </div>
        )}
        <h1 className="text-3xl font-bold tracking-tight text-white">AI Tutor</h1>
        <p className="text-[#9D9D9D] mt-2">
          Your personal AI tutor is here to help you learn. Ask any question about the course material.
        </p>
      </div>
      
      <ChatInterface 
        videoId={cleanedVideoId} 
        videoTitle={videoTitle} 
        courseId={courseId}
        lessonId={lessonId}
      />
    </div>
  )
} 