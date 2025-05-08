import { client } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Allow requests without authentication for preview functionality
    const user = await currentUser()
    
    // Validate the video ID
    if (!id || typeof id !== 'string') {
      console.error('Invalid video ID:', id);
      return NextResponse.json(
        { status: 400, error: 'Invalid video ID' },
        { status: 400 }
      )
    }
    
    const video = await client.video.findUnique({
      where: { id },
      select: {
        title: true,
        summery: true,
        description: true,
        source: true,
        userId: true,
        User: {
          select: {
            clerkid: true,
            firstname: true,
            lastname: true
          }
        }
      }
    })

    if (!video) {
      console.error('Video not found with ID:', id);
      return NextResponse.json(
        { status: 404, error: 'Video not found', id },
        { status: 404 }
      )
    }
    
    // Check if this is a preview request
    const isPreviewPath = req.nextUrl.pathname.includes('/preview/');
    
    // If we have a user, include ownership information
    const isOwner = user ? (video.userId === user.id || video.User?.clerkid === user.id) : false;
    
    // For non-preview paths, require authentication
    if (!isPreviewPath && !user && !req.nextUrl.pathname.includes('/public/')) {
      return NextResponse.json(
        { status: 401, error: 'Authentication required for non-preview access' },
        { status: 401 }
      )
    }
    
    // Return the video data
    return NextResponse.json({ 
      status: 200, 
      data: video,
      isOwner
    })
  } catch (error) {
    console.error('Error fetching video data:', error)
    return NextResponse.json(
      { status: 500, error: 'Failed to fetch video data', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json(
        { status: 401, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params
    
    // First check if the video exists and belongs to the user
    const existingVideo = await client.video.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        User: {
          select: {
            clerkid: true
          }
        }
      }
    })

    if (!existingVideo) {
      return NextResponse.json(
        { status: 404, error: 'Video not found' },
        { status: 404 }
      )
    }

    // Check if the user owns the video or has admin rights
    // This can be expanded based on your permissions model
    const isOwner = existingVideo.userId === user.id || 
                   existingVideo.User?.clerkid === user.id;
    
    if (!isOwner && user.publicMetadata.role !== 'admin') {
      return NextResponse.json(
        { status: 403, error: 'You do not have permission to delete this video' },
        { status: 403 }
      )
    }

    // Delete the video
    await client.video.delete({
      where: { id }
    })

    return NextResponse.json({ 
      status: 200, 
      message: 'Video deleted successfully' 
    })
  } catch (error) {
    console.error('Error deleting video:', error)
    return NextResponse.json(
      { status: 500, error: 'Failed to delete video' },
      { status: 500 }
    )
  }
} 