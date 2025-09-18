/**
 * Simple relative time formatter without external dependencies
 * Provides similar functionality to date-fns formatDistanceToNow
 */

export const formatRelativeTime = (
  date: string | number | Date,
  options: { addSuffix?: boolean } = {}
): string => {
  const { addSuffix = false } = options
  const now = new Date()
  const targetDate = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000)

  // Handle future dates
  if (diffInSeconds < 0) {
    const futureDiff = Math.abs(diffInSeconds)
    if (futureDiff < 60) return addSuffix ? 'in a few seconds' : 'a few seconds'
    if (futureDiff < 3600) return addSuffix ? `in ${Math.floor(futureDiff / 60)} minutes` : `${Math.floor(futureDiff / 60)} minutes`
    if (futureDiff < 86400) return addSuffix ? `in ${Math.floor(futureDiff / 3600)} hours` : `${Math.floor(futureDiff / 3600)} hours`
    if (futureDiff < 2592000) return addSuffix ? `in ${Math.floor(futureDiff / 86400)} days` : `${Math.floor(futureDiff / 86400)} days`
    if (futureDiff < 31536000) return addSuffix ? `in ${Math.floor(futureDiff / 2592000)} months` : `${Math.floor(futureDiff / 2592000)} months`
    return addSuffix ? `in ${Math.floor(futureDiff / 31536000)} years` : `${Math.floor(futureDiff / 31536000)} years`
  }

  // Handle past dates
  if (diffInSeconds < 60) return addSuffix ? 'a few seconds ago' : 'a few seconds'
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return addSuffix ? `${minutes} minute${minutes === 1 ? '' : 's'} ago` : `${minutes} minute${minutes === 1 ? '' : 's'}`
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return addSuffix ? `${hours} hour${hours === 1 ? '' : 's'} ago` : `${hours} hour${hours === 1 ? '' : 's'}`
  }
  if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400)
    return addSuffix ? `${days} day${days === 1 ? '' : 's'} ago` : `${days} day${days === 1 ? '' : 's'}`
  }
  if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000)
    return addSuffix ? `${months} month${months === 1 ? '' : 's'} ago` : `${months} month${months === 1 ? '' : 's'}`
  }
  const years = Math.floor(diffInSeconds / 31536000)
  return addSuffix ? `${years} year${years === 1 ? '' : 's'} ago` : `${years} year${years === 1 ? '' : 's'}`
}
