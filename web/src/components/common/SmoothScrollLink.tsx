import { forwardRef } from 'react'
import type { AnchorHTMLAttributes, MouseEvent } from 'react'
import { useLenis } from 'lenis/react'

type SmoothScrollLinkProps = AnchorHTMLAttributes<HTMLAnchorElement>

const SmoothScrollLink = forwardRef<HTMLAnchorElement, SmoothScrollLinkProps>(
  ({ href, onClick, ...rest }, ref) => {
    const lenis = useLenis()

    const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event)
      if (event.defaultPrevented) return

      if (!href || !href.startsWith('#') || href.length === 1 || !lenis) return

      const target = document.querySelector(href)
      if (!(target instanceof HTMLElement)) return

      event.preventDefault()
      lenis.scrollTo(target)
    }

    return <a ref={ref} href={href} onClick={handleClick} {...rest} />
  },
)

SmoothScrollLink.displayName = 'SmoothScrollLink'

export default SmoothScrollLink
