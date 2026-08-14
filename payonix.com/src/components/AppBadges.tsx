import Image from "next/image";
import { APP_LINKS } from "@/lib/constants";

export default function AppBadges({
  iosAlt,
  androidAlt,
  variant = "light",
}: {
  iosAlt: string;
  androidAlt: string;
  variant?: "light" | "footer";
}) {
  const ios = variant === "footer" ? "/footer-appstore.svg" : "/appstore.svg";
  const android =
    variant === "footer" ? "/footer-googleplay.svg" : "/googleplay.svg";
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <a
        href={APP_LINKS.ios}
        target="_blank"
        rel="noopener noreferrer"
        className="transition hover:scale-105"
      >
        <Image src={ios} alt={iosAlt} width={160} height={48} />
      </a>
      <a
        href={APP_LINKS.android}
        target="_blank"
        rel="noopener noreferrer"
        className="transition hover:scale-105"
      >
        <Image src={android} alt={androidAlt} width={160} height={48} />
      </a>
    </div>
  );
}
