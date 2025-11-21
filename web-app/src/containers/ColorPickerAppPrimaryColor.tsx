import { useAppearance, isDefaultColorPrimary } from '@/hooks/useAppearance'
import { cn } from '@/lib/utils'
import { RgbaColor, RgbaColorPicker } from 'react-colorful'
import { IconColorPicker } from '@tabler/icons-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ColorPickerAppPrimaryColor() {
  const { appPrimaryBgColor, setAppPrimaryBgColor } = useAppearance()

  const predefineappPrimaryBgColor: RgbaColor[] = [
    {
      r: 86,
      g: 23,
      b: 126,
      a: 1,
    },
    {
      r: 128,
      g: 47,
      b: 124,
      a: 1,
    },
    {
      r: 77,
      g: 8,
      b: 106,
      a: 1,
    },
    {
      r: 70,
      g: 2,
      b: 104,
      a: 1,
    },
  ]

  return (
    <div className="flex items-center gap-1.5">
      {predefineappPrimaryBgColor.map((item, i) => {
        const isSelected =
          (item.r === appPrimaryBgColor.r &&
          item.g === appPrimaryBgColor.g &&
          item.b === appPrimaryBgColor.b &&
          item.a === appPrimaryBgColor.a) ||
          (isDefaultColorPrimary(appPrimaryBgColor) && isDefaultColorPrimary(item))
        return (
          <div
            key={i}
            className={cn(
              'size-4 rounded-full border border-main-view-fg/20',
              isSelected && 'ring-2 ring-accent border-none'
            )}
            onClick={() => {
              setAppPrimaryBgColor(item)
            }}
            style={{
              backgroundColor: `rgba(${item.r}, ${item.g}, ${item.b}, ${item.a})`,
            }}
          />
        )
      })}

      <div className="">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              title="Pick Color App Primary"
              className="size-6 cursor-pointer flex items-center justify-center rounded-sm hover:bg-main-view-fg/10 transition-all duration-200 ease-in-out data-[state=open]:bg-main-view-fg/10"
            >
              <IconColorPicker size={18} className="text-main-view-fg/50" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="border-none w-full h-full overflow-visible"
            side="right"
            align="start"
            style={{ zIndex: 9999 }}
          >
            <div>
              <RgbaColorPicker
                color={appPrimaryBgColor}
                onChange={(color) => {
                  setAppPrimaryBgColor(color)
                }}
              />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
