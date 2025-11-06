import { Link } from '@tanstack/react-router'
import { route } from '@/constants/routes'
import { useTranslation } from '@/i18n/react-i18next-compat'
import { useState } from 'react'
import {
	IconMenu2,
	IconX,
} from '@tabler/icons-react'
import { useMatches } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

const SettingsMenu = () => {
	const { t } = useTranslation()
	const [isMenuOpen, setIsMenuOpen] = useState(false)
	const matches = useMatches()

	const menuSettings: Array<{ title: string; route: string; hasSubMenu?: boolean }> = [
		{
			title: 'common:general',
			route: route.settings.general,
		},
		{
			title: 'common:appearance',
			route: route.settings.appearance,
		},
		{
			title: 'common:profile',
			route: route.settings.privacy,
		},
		{
			title: 'common:keyboardShortcuts',
			route: route.settings.shortcuts,
		},
		{
			title: 'common:hardware',
			route: route.settings.hardware,
		},
		{
			title: 'common:mcp-servers',
			route: route.settings.mcp_servers,
		},
		{
			title: 'common:https_proxy',
			route: route.settings.https_proxy,
		},
		{
			title: 'common:extensions',
			route: route.settings.extensions,
		},
	]

	const toggleMenu = () => {
		setIsMenuOpen(!isMenuOpen)
	}

	return (
		<>
			<button
				className="fixed top-4 right-4 sm:hidden size-5 cursor-pointer items-center justify-center rounded hover:bg-main-view-fg/10 transition-all duration-200 ease-in-out data-[state=open]:bg-main-view-fg/10 z-20"
				onClick={toggleMenu}
				aria-label="Toggle settings menu"
			>
				{isMenuOpen ? (
					<IconX size={18} className="text-main-view-fg relative z-20" />
				) : (
					<IconMenu2 size={18} className="text-main-view-fg relative z-20" />
				)}
			</button>
			<div
				className={cn(
					'h-full w-44 shrink-0 px-1.5 pt-3 border-r border-main-view-fg/5 bg-main-view',
					'sm:flex',
					isMenuOpen
						? 'flex fixed sm:hidden top-0 z-10 m-1 h-[calc(100%-8px)] border-r-0 border-l bg-main-view right-0 py-8 rounded-tr-lg rounded-br-lg'
						: 'hidden'
				)}
			>
				<div className="flex flex-col gap-1 w-full text-main-view-fg/90 font-medium">
					{menuSettings.map((menu) => (
						<div key={menu.title}>
							<Link
								to={menu.route}
								className="block px-2 gap-1.5 cursor-pointer hover:bg-main-view-fg/5 py-1 w-full rounded [&.active]:bg-main-view-fg/5"
							>
								<span className="text-main-view-fg/80">{t(menu.title)}</span>
							</Link>
						</div>
					))}
				</div>
			</div>
		</>
	)
}

export default SettingsMenu
