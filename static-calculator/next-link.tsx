import { forwardRef, type AnchorHTMLAttributes } from "react";

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

const Link = forwardRef<HTMLAnchorElement, LinkProps>(({ href, target, ...props }, ref) => (
  <a ref={ref} href={href} target={target ?? (href.startsWith("/") ? "_parent" : undefined)} {...props} />
));

Link.displayName = "StaticLink";

export default Link;
