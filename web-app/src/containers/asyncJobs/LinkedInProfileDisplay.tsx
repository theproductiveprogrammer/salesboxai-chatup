import { useState } from 'react'
import { Briefcase, GraduationCap, MapPin, Users, FileText, ChevronDown, ChevronUp, ThumbsUp, MessageCircle, Share2, Repeat2, ExternalLink, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from '@tanstack/react-router'
import { route } from '@/constants/routes'
import { useLeadContext } from '@/hooks/useLeadContext'

interface LinkedInProfileDisplayProps {
  result: any
  input?: any
}

export function LinkedInProfileDisplay({ result, input }: LinkedInProfileDisplayProps) {
  const router = useRouter()
  const { setLeadContext } = useLeadContext()
  // The result structure is: result.output.profile and result.output.posts
  const output = result?.output
  const [showPosts, setShowPosts] = useState(false)

  if (!output || !output.profile) {
    return (
      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-md">
        <p className="text-sm text-gray-600 dark:text-gray-400">No profile data available</p>
      </div>
    )
  }

  const profile = output.profile
  const posts = output.posts || []

  // Get LinkedIn URL from input (try different field names)
  const getLinkedInUrl = (): string | undefined => {
    return input?.linkedin || input?.linkedinUrl || input?.linkedInUrl || input?.url
  }

  // Format lead data for prompt
  const formatLeadForPrompt = (): string => {
    const parts: string[] = []
    const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
    const linkedinUrl = getLinkedInUrl()

    if (name) parts.push(name)
    if (linkedinUrl) parts.push(linkedinUrl)

    return parts.join(' - ')
  }

  // Handler to navigate to chat with Appointment Setting prompt
  const handleChatWithLead = async () => {
    const linkedinUrl = getLinkedInUrl()

    try {
      // Set lead context before navigation
      setLeadContext({
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
        linkedin: linkedinUrl,
        id: input?.leadId || input?.id,
        title: profile.headline,
      })

      // Pre-fill with Appointment Setting prompt
      const leadData = formatLeadForPrompt()
      const message = `Please try and set an appointment with: ${leadData}`

      // Navigate to home (New Chat) with pre-filled message
      await router.navigate({
        to: route.home,
        search: { message },
      })

      console.log('Successfully navigated to new chat with pre-filled message')
    } catch (error) {
      console.error('Error navigating to chat:', error)
    }
  }

  const linkedinUrl = getLinkedInUrl()
  const showChatButton = linkedinUrl || input  // Show if we have LinkedIn URL or any input

  return (
    <div className="mt-4 space-y-4">
      {/* Profile Header */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start gap-4">
          {profile.profile_picture_url && (
            <img
              src={profile.profile_picture_url}
              alt={`${profile.first_name} ${profile.last_name}`}
              className="w-20 h-20 rounded-full object-cover border-2 border-blue-300 dark:border-blue-700"
            />
          )}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-100">
                  {profile.first_name} {profile.last_name}
                </h3>
                {profile.headline && (
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">{profile.headline}</p>
                )}
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-blue-600 dark:text-blue-400">
                  {profile.location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={14} />
                      {profile.location}
                    </span>
                  )}
                  {profile.follower_count !== undefined && (
                    <span className="flex items-center gap-1">
                      <Users size={14} />
                      {profile.follower_count} connections
                    </span>
                  )}
                </div>
              </div>
              {showChatButton && (
                <Button
                  size="sm"
                  onClick={handleChatWithLead}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                  title="Start appointment setting chat"
                >
                  <MessageSquare size={16} />
                  Chat
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Work Experience */}
      {profile.work_experience && profile.work_experience.length > 0 && (
        <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h4 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100 mb-3">
            <Briefcase size={16} />
            Work Experience
          </h4>
          <div className="space-y-3">
            {profile.work_experience.slice(0, 3).map((exp: any, idx: number) => (
              <div key={idx} className="text-sm">
                <p className="font-medium text-gray-900 dark:text-gray-100">{exp.position}</p>
                {exp.company && <p className="text-gray-600 dark:text-gray-400">{exp.company}</p>}
                {(exp.start || exp.end) && (
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {exp.start} - {exp.end || 'Present'}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {profile.education && profile.education.length > 0 && (
        <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h4 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100 mb-3">
            <GraduationCap size={16} />
            Education
          </h4>
          <div className="space-y-3">
            {profile.education.slice(0, 2).map((edu: any, idx: number) => (
              <div key={idx} className="text-sm">
                {edu.degree && <p className="font-medium text-gray-900 dark:text-gray-100">{edu.degree}</p>}
                {edu.school && <p className="text-gray-600 dark:text-gray-400">{edu.school}</p>}
                {(edu.start || edu.end) && (
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {edu.start} - {edu.end || 'Present'}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Posts Summary */}
      {posts.length > 0 && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setShowPosts(!showPosts)}
          >
            <h4 className="flex items-center gap-2 font-semibold text-green-900 dark:text-green-100">
              <FileText size={16} />
              Recent Activity
            </h4>
            <button className="text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100 transition-colors">
              {showPosts ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>

          {!showPosts ? (
            <p className="text-sm text-green-700 dark:text-green-300 mt-2">
              Successfully fetched {posts.length} recent {posts.length === 1 ? 'post' : 'posts'}
            </p>
          ) : (
            <div className="mt-3 space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {posts.map((post: any, idx: number) => (
                <div key={idx} className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  {/* Post Header - Author Info */}
                  {post.author && (
                    <div className="flex items-start gap-3 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
                      {post.author.profile_picture_url && (
                        <img
                          src={post.author.profile_picture_url}
                          alt={`${post.author.first_name} ${post.author.last_name}`}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                          {post.author.first_name} {post.author.last_name}
                        </p>
                        {post.author.headline && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {post.author.headline}
                          </p>
                        )}
                        {post.created_at && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {new Date(post.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        )}
                      </div>
                      {post.is_repost && (
                        <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                          <Repeat2 size={14} />
                          <span>Repost</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Post Content */}
                  {post.text && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
                        {post.text}
                      </p>
                    </div>
                  )}

                  {/* Post Images */}
                  {post.images && post.images.length > 0 && (
                    <div className="mb-3 grid grid-cols-2 gap-2">
                      {post.images.slice(0, 4).map((img: string, imgIdx: number) => (
                        <img
                          key={imgIdx}
                          src={img}
                          alt={`Post image ${imgIdx + 1}`}
                          className="w-full h-32 object-cover rounded-md"
                        />
                      ))}
                    </div>
                  )}

                  {/* Engagement Stats */}
                  <div className="flex items-center gap-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                    {post.reactions_count !== undefined && post.reactions_count > 0 && (
                      <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                        <ThumbsUp size={14} className="text-blue-600 dark:text-blue-400" />
                        <span>{post.reactions_count.toLocaleString()}</span>
                      </div>
                    )}
                    {post.comments_count !== undefined && post.comments_count > 0 && (
                      <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                        <MessageCircle size={14} className="text-green-600 dark:text-green-400" />
                        <span>{post.comments_count.toLocaleString()}</span>
                      </div>
                    )}
                    {post.shares_count !== undefined && post.shares_count > 0 && (
                      <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                        <Share2 size={14} className="text-purple-600 dark:text-purple-400" />
                        <span>{post.shares_count.toLocaleString()}</span>
                      </div>
                    )}
                    {post.url && (
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <span>View on LinkedIn</span>
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
