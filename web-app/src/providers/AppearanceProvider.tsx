import { useEffect } from 'react'
import { useAppearance } from '@/hooks/useAppearance'
import { useTheme } from '@/hooks/useTheme'

/**
 * AppearanceProvider ensures appearance settings are applied on every page load
 * This component should be mounted at the root level of the application
 */
export function AppearanceProvider() {
  const {
    fontSize,
    appBgColor,
    appLeftPanelTextColor,
    appMainViewBgColor,
    appMainViewTextColor,
    appPrimaryBgColor,
    appPrimaryTextColor,
    appAccentBgColor,
    appAccentTextColor,
    appDestructiveBgColor,
    appDestructiveTextColor,
  } = useAppearance()
  const { isDark } = useTheme()

  // Apply appearance settings on mount and when they change
  useEffect(() => {
    // Apply font size
    document.documentElement.style.setProperty('--font-size-base', fontSize)

    // Hide alpha slider when IS_LINUX || !IS_TAURI
    const shouldHideAlpha = IS_LINUX || !IS_TAURI
    let alphaStyleElement = document.getElementById('alpha-slider-style')

    if (shouldHideAlpha) {
      if (!alphaStyleElement) {
        alphaStyleElement = document.createElement('style')
        alphaStyleElement.id = 'alpha-slider-style'
        document.head.appendChild(alphaStyleElement)
      }
      alphaStyleElement.textContent =
        '.react-colorful__alpha { display: none !important; }'
    } else if (alphaStyleElement) {
      alphaStyleElement.remove()
    }

    // Apply app background color
    // Import culori functions dynamically to avoid SSR issues
    import('culori').then(({ rgb, oklch, formatCss }) => {
      // Convert RGBA to a format culori can work with
      const culoriRgb = rgb({
        mode: 'rgb',
        r: appBgColor.r / 255,
        g: appBgColor.g / 255,
        b: appBgColor.b / 255,
        alpha: IS_WINDOWS || IS_LINUX || !IS_TAURI ? 1 : appBgColor.a,
      })

      const culoriRgbMainView = rgb({
        mode: 'rgb',
        r: appMainViewBgColor.r / 255,
        g: appMainViewBgColor.g / 255,
        b: appMainViewBgColor.b / 255,
        alpha: appMainViewBgColor.a,
      })

      const culoriRgbPrimary = rgb({
        mode: 'rgb',
        r: appPrimaryBgColor.r / 255,
        g: appPrimaryBgColor.g / 255,
        b: appPrimaryBgColor.b / 255,
        alpha: appPrimaryBgColor.a,
      })

      const culoriRgbAccent = rgb({
        mode: 'rgb',
        r: appAccentBgColor.r / 255,
        g: appAccentBgColor.g / 255,
        b: appAccentBgColor.b / 255,
        alpha: appAccentBgColor.a,
      })

      const culoriRgbDestructive = rgb({
        mode: 'rgb',
        r: appDestructiveBgColor.r / 255,
        g: appDestructiveBgColor.g / 255,
        b: appDestructiveBgColor.b / 255,
        alpha: appDestructiveBgColor.a,
      })

      // Convert to OKLCH for CSS variable
      const oklchColor = oklch(culoriRgb)
      const oklchColormainViewApp = oklch(culoriRgbMainView)
      const oklchColorPrimary = oklch(culoriRgbPrimary)
      const oklchColorAccent = oklch(culoriRgbAccent)
      const oklchColorDestructive = oklch(culoriRgbDestructive)

      if (oklchColor) {
        document.documentElement.style.setProperty(
          '--app-bg',
          formatCss(oklchColor)
        )
      }
      if (oklchColormainViewApp) {
        document.documentElement.style.setProperty(
          '--app-main-view',
          formatCss(oklchColormainViewApp)
        )
      }
      if (oklchColorPrimary) {
        document.documentElement.style.setProperty(
          '--app-primary',
          formatCss(oklchColorPrimary)
        )
      }
      if (oklchColorAccent) {
        document.documentElement.style.setProperty(
          '--app-accent',
          formatCss(oklchColorAccent)
        )
      }
      if (oklchColorDestructive) {
        document.documentElement.style.setProperty(
          '--app-destructive',
          formatCss(oklchColorDestructive)
        )
      }
    })

    // Apply text color based on background brightness
    document.documentElement.style.setProperty(
      '--app-left-panel-fg',
      appLeftPanelTextColor
    )

    // Apply text color based on background brightness
    document.documentElement.style.setProperty(
      '--app-main-view-fg',
      appMainViewTextColor
    )

    // Apply text color based on background brightness for primary
    document.documentElement.style.setProperty(
      '--app-primary-fg',
      appPrimaryTextColor
    )

    // Apply text color based on background brightness for accent
    document.documentElement.style.setProperty(
      '--app-accent-fg',
      appAccentTextColor
    )

    // Apply text color based on background brightness for destructive
    document.documentElement.style.setProperty(
      '--app-destructive-fg',
      appDestructiveTextColor
    )
  }, [
    fontSize,
    appBgColor,
    appLeftPanelTextColor,
    isDark,
    appMainViewBgColor,
    appMainViewTextColor,
    appPrimaryBgColor,
    appPrimaryTextColor,
    appAccentBgColor,
    appAccentTextColor,
    appDestructiveBgColor,
    appDestructiveTextColor,
  ])

  // Color customization removed - colors are now fixed to brand defaults
  // The first useEffect above already handles applying colors from state to CSS variables

  return null
}
