import { getUserProfile, getVideoComments } from '@/actions/user'
import { getPreviewVideo } from '@/actions/workspace'
import LessonView from '@/components/courses/lesson-view'
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query'
import React from 'react'
import { client } from '@/lib/prisma'
import { AlertOctagon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

type Props = {
  params: {
    videoId: string,
    workspaceId: string
  }
}

const VideoPage = async ({ params: { videoId, workspaceId } }: Props) => {
  const query = new QueryClient()
  
  // Clean the videoId parameter to prevent issues with malformed IDs
  const cleanedVideoId = videoId.replace(/[^a-zA-Z0-9-]/g, '');
  
  // Log if the ID was modified
  if (cleanedVideoId !== videoId) {
    console.log(`[DEBUG_DASHBOARD] Cleaned videoId before processing: Original=${videoId}, Cleaned=${cleanedVideoId}`);
  }
  
  console.log(`[DEBUG_DASHBOARD] Loading video for workspaceId: ${workspaceId}, videoId: ${cleanedVideoId}`);

  // Prefetch the video data
  const videoData = await getPreviewVideo(cleanedVideoId);
  console.log(`[DEBUG_DASHBOARD] Video data response status: ${videoData?.status}`, 
    { videoExists: Boolean(videoData?.data), error: videoData?.message, cleanedVideoId });
  
  // Try to find if this video belongs to a course
  let courseId = '';
  let lessonId = '';
  
  if (videoData?.status === 200 && videoData?.data) {
    try {
      // Check if this video is associated with a lesson in a course
      const lesson = await client.lesson.findFirst({
        where: {
          videoId: cleanedVideoId,
        },
        include: {
          section: {
            include: {
              Course: true,
            },
          },
        },
      });
      
      if (lesson && lesson.section?.Course?.id) {
        courseId = lesson.section.Course.id;
        lessonId = lesson.id;
        console.log(`[DEBUG_DASHBOARD] Found course context: courseId=${courseId}, lessonId=${lessonId}`);
      }
    } catch (error) {
      console.error('[DEBUG_DASHBOARD] Error finding course context:', error);
    }
  }
  
  // Handle 404 or error cases with a better UI
  if (videoData?.status !== 200 || !videoData?.data) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 flex items-center justify-center rounded-full bg-red-500/10 mb-4">
          <AlertOctagon className="h-10 w-10 text-red-500" />
        </div>
        <h3 className="text-xl font-medium text-foreground mb-2">Video Not Available</h3>
        <p className="text-muted-foreground max-w-md mb-4">
          {videoData?.message || "This video could not be loaded. It may have been removed or there was an error processing it."}
        </p>
        
        <div className="bg-gray-800 p-4 rounded-md text-left text-sm text-gray-300 mb-6 max-w-lg overflow-auto">
          <h4 className="font-mono border-b border-gray-600 pb-1 mb-2">Debug Information:</h4>
          <p>Requested Video ID: <span className="font-mono text-white">{videoId}</span></p>
          <p>Cleaned Video ID: <span className="font-mono text-white">{cleanedVideoId}</span></p>
          <p>Error Status: <span className="font-mono text-white">{videoData?.status || "Unknown"}</span></p>
          <p>Error Message: <span className="font-mono text-white">{videoData?.message || "No specific error message"}</span></p>
        </div>
        
        <div className="flex gap-3">
          <Link href={`/dashboard/${workspaceId}`} passHref>
            <Button variant="outline">
              Back to Dashboard
            </Button>
          </Link>
          
          <Button 
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => window.location.reload()}
          >
            Retry Loading
          </Button>
        </div>
      </div>
    )
  }

  await query.prefetchQuery({
    queryKey: ['preview-video'],
    queryFn: () => Promise.resolve(videoData),
  })

  await query.prefetchQuery({
    queryKey: ['user-profile'],
    queryFn: getUserProfile,
  })

  await query.prefetchQuery({
    queryKey: ['video-comments'],
    queryFn: () => getVideoComments(cleanedVideoId),
  })

  // Extract video details for the LessonView component
  const videoTitle = videoData?.data?.title || 'Video Preview'
  const transcript = videoData?.data?.summery || ''

  return (
    <HydrationBoundary state={dehydrate(query)}>
      <div className="max-w-5xl mx-auto px-6 py-6">
        <LessonView
          courseId={courseId}
          lessonId={lessonId || cleanedVideoId}
          title={videoTitle}
          description=""
          type="video"
          videoId={cleanedVideoId}
          isPreview={!courseId}
          transcript={transcript}
        />
      </div>
    </HydrationBoundary>
  )
}

export default VideoPage
