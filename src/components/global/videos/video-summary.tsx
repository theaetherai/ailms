'use client'

import { TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import React, { useState } from 'react'
import { SparklesIcon } from 'lucide-react'
import { generateVideoSummary } from '@/actions/workspace'

type Props = {
  description: string | null
  videoId: string
  isProUser: boolean
}

const VideoSummary = ({ description, videoId, isProUser }: Props) => {
  const [loading, setLoading] = useState(false)
  const [summaryContent, setSummaryContent] = useState<string | null>(null)
  
  // Try to extract the educational summary from the description
  React.useEffect(() => {
    if (description) {
      try {
        const parsedData = JSON.parse(description)
        if (parsedData.educationalSummary || parsedData.aiSummary) {
          const summary = parsedData.educationalSummary || parsedData.aiSummary
          setSummaryContent(summary)
        }
      } catch (e) {
        // Not a JSON string or no summary available
        setSummaryContent(null)
      }
    }
  }, [description])
  
  const handleGenerateSummary = async () => {
    setLoading(true)
    try {
      const result = await generateVideoSummary(videoId)
      if (result.status === 200 && result.data && result.data.summary) {
        setSummaryContent(result.data.summary)
      }
    } catch (error) {
      console.error("Failed to generate summary:", error)
    } finally {
      setLoading(false)
    }
  }

  // Function to render markdown-like content
  const renderFormattedContent = (content: string) => {
    if (!content) return <p className="text-[#a7a7a7]">No summary content available.</p>;
    
    // Process different formats of the content
    let processedContent = content;
    
    // Replace markdown-style headers with styled elements
    processedContent = processedContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Split by newlines to separate into paragraphs
    const paragraphs = processedContent.split('\n\n').filter(p => p.trim().length > 0);
    
    return (
      <div className="space-y-5">
        {paragraphs.map((paragraph, pIndex) => {
          // If paragraph starts with a heading (like "**Key Concepts:**")
          if (paragraph.match(/^<strong>.*?:<\/strong>/)) {
            const lines = paragraph.split('\n').filter(line => line.trim().length > 0);
            const heading = lines[0];
            const items = lines.slice(1);
            
            return (
              <div key={`p-${pIndex}`} className="mb-4">
                <h3 
                  className="text-white text-lg font-medium mb-2" 
                  dangerouslySetInnerHTML={{ __html: heading }}
                />
                
                <ul className="space-y-2 pl-1">
                  {items.map((item, lIndex) => {
                    let listItem = item;
                    // Check if this is a bullet point
                    if (item.trim().startsWith('*')) {
                      listItem = item.trim().substring(1).trim();
                      return (
                        <li 
                          key={`li-${pIndex}-${lIndex}`} 
                          className="flex items-start gap-2 text-[#a7a7a7]"
                        >
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></span>
                          <span dangerouslySetInnerHTML={{ __html: listItem }} />
                        </li>
                      );
                    } else {
                      return (
                        <p 
                          key={`p-${pIndex}-${lIndex}`} 
                          className="text-[#a7a7a7]"
                          dangerouslySetInnerHTML={{ __html: listItem }}
                        />
                      );
                    }
                  })}
                </ul>
              </div>
            );
          } 
          // If the paragraph consists only of bullet points
          else if (paragraph.split('\n').every(line => line.trim().startsWith('*'))) {
            const items = paragraph.split('\n').filter(line => line.trim().length > 0);
            
            return (
              <ul key={`ul-${pIndex}`} className="space-y-2 pl-1">
                {items.map((item, iIndex) => {
                  const listItem = item.trim().substring(1).trim();
                  return (
                    <li 
                      key={`li-${pIndex}-${iIndex}`} 
                      className="flex items-start gap-2 text-[#a7a7a7]"
                    >
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></span>
                      <span dangerouslySetInnerHTML={{ __html: listItem }} />
                    </li>
                  );
                })}
              </ul>
            );
          }
          // Regular paragraph
          else {
            return (
              <p 
                key={`p-${pIndex}`} 
                className="text-[#a7a7a7]" 
                dangerouslySetInnerHTML={{ __html: paragraph }}
              />
            );
          }
        })}
      </div>
    );
  };

  return (
    <TabsContent
      value="Summary"
      className="rounded-xl flex flex-col gap-y-6"
    >
      {summaryContent ? (
        <div className="space-y-4">
          <h3 className="text-xl font-medium text-white mb-4">Educational Summary</h3>
          <div className="h-[calc(56.25vw*0.66)] max-h-[480px] overflow-y-auto pr-4 custom-scrollbar">
            {renderFormattedContent(summaryContent)}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 space-y-4 h-[calc(56.25vw*0.66)] max-h-[480px]">
          <p className="text-[#a7a7a7] text-center">
            {isProUser 
              ? "No educational summary available for this video yet." 
              : "Educational summaries are available only for PRO users."}
          </p>
          {isProUser && (
            <Button 
              onClick={handleGenerateSummary} 
              disabled={loading}
              className="bg-secondary hover:bg-secondary/90 text-white flex items-center gap-2"
            >
              <SparklesIcon size={16} />
              {loading ? "Generating..." : "Generate Summary"}
            </Button>
          )}
        </div>
      )}
    </TabsContent>
  )
}

export default VideoSummary 