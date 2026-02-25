"use client"

import { cn } from "@/lib/utils"
import type { GameCard as GameCardType, CardColor } from "@/lib/game-types"
import { isPropertyCard, isActionCard, isMoneyCard, isRentCard, isPropertyWildcard, isWildRentCard } from "@/lib/game-types"
import { Zap, Banknote, DollarSign, Shuffle, Home, Building2, Ban, ChevronDown } from "lucide-react"

/* colour mapping per set */
const colorMap: Record<CardColor, {
  bg: string; border: string; text: string; accent: string; banner: string
}> = {
  darkblue: { bg: "bg-card-darkblue-bg", border: "border-card-darkblue-border", text: "text-card-darkblue", accent: "bg-card-darkblue", banner: "bg-card-darkblue-banner" },
  lightblue: { bg: "bg-card-lightblue-bg", border: "border-card-lightblue-border", text: "text-card-lightblue", accent: "bg-card-lightblue", banner: "bg-card-lightblue-banner" },
  brown: { bg: "bg-card-brown-bg", border: "border-card-brown-border", text: "text-card-brown", accent: "bg-card-brown", banner: "bg-card-brown-banner" },
  green: { bg: "bg-card-green-bg", border: "border-card-green-border", text: "text-card-green", accent: "bg-card-green", banner: "bg-card-green-banner" },
  utility: { bg: "bg-card-utility-bg", border: "border-card-utility-border", text: "text-card-utility", accent: "bg-card-utility", banner: "bg-card-utility-banner" },
  red: { bg: "bg-card-red-bg", border: "border-card-red-border", text: "text-card-red", accent: "bg-card-red", banner: "bg-card-red-banner" },
  yellow: { bg: "bg-card-yellow-bg", border: "border-card-yellow-border", text: "text-card-yellow", accent: "bg-card-yellow", banner: "bg-[var(--card-yellow)]" },
  orange: { bg: "bg-card-orange-bg", border: "border-card-orange-border", text: "text-card-orange", accent: "bg-card-orange", banner: "bg-card-orange-banner" },
  pink: { bg: "bg-card-pink-bg", border: "border-card-pink-border", text: "text-card-pink", accent: "bg-card-pink", banner: "bg-card-pink-banner" },
  railroad: { bg: "bg-card-railroad-bg", border: "border-card-railroad-border", text: "text-card-railroad", accent: "bg-card-railroad", banner: "bg-card-railroad-banner" },
  purple: { bg: "bg-card-purple-bg", border: "border-card-purple-border", text: "text-card-purple", accent: "bg-card-purple", banner: "bg-card-purple-banner" },
  all: { bg: "bg-muted", border: "border-muted", text: "text-foreground", accent: "bg-muted", banner: "bg-muted" },
}

/* money color by value */
function moneyColor(val: number) {
  if (val >= 10) return "bg-money-10 text-[oklch(0.20_0.04_85)]"
  if (val >= 5) return "bg-money-5 text-[oklch(0.20_0.04_52)]"
  if (val >= 3) return "bg-money-3 text-[oklch(0.15_0.03_155)]"
  if (val >= 2) return "bg-money-2 text-[oklch(0.15_0.04_170)]"
  return "bg-money-1 text-[oklch(0.18_0.04_220)]"
}

/* Action card color by name */
function actionBg(name: string): string {
  const n = name.toUpperCase()
  if (n.includes("DEAL BREAKER")) return "bg-card-purple-banner"
  if (n.includes("BIRTHDAY") || n.includes("DEBT")) return "bg-[oklch(0.38_0.22_15)]"
  if (n.includes("JUST SAY NO")) return "bg-[oklch(0.42_0.18_260)]"
  if (n.includes("PASS GO")) return "bg-card-green-banner"
  if (n.includes("HOUSE")) return "bg-card-utility-banner"
  if (n.includes("HOTEL")) return "bg-card-utility-banner"
  if (n.includes("DOUBLE")) return "bg-card-orange-banner"
  return "bg-card-action-banner"
}

function getActionIcon(name: string) {
  const n = name.toUpperCase()
  if (n.includes("HOUSE")) return Home
  if (n.includes("HOTEL")) return Building2
  if (n.includes("JUST SAY NO")) return Ban
  return Zap
}

const CARD_OUTLINE = "border-[1.5px] border-[oklch(0.20_0.01_260)]"

const SIZE = {
  md: { wrapper: "w-24 h-[134px]", bannerH: "h-8", nameText: "text-[8px]", rentText: "text-[7px]" },
  sm: { wrapper: "w-11 h-[62px]", bannerH: "h-4", nameText: "text-[5px]", rentText: "hidden" },
}

interface GameCardProps {
  card: GameCardType
  size?: "sm" | "md"
  selected?: boolean
  onClick?: () => void
  burnMode?: boolean
  burnSelected?: boolean
}

export function GameCard({ card, size = "md", selected = false, onClick, burnMode = false, burnSelected = false }: GameCardProps) {
  const s = SIZE[size]

  const selectionRing = burnMode
    ? burnSelected
      ? "ring-2 ring-destructive ring-offset-2 ring-offset-background"
      : ""
    : selected
      ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
      : ""

  /* PROPERTY CARD */
  if (isPropertyCard(card)) {
    const c = colorMap[card.color]
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "card-lift relative flex flex-col overflow-hidden rounded-xl",
          CARD_OUTLINE, s.wrapper, selectionRing,
          onClick && "cursor-pointer"
        )}
        aria-label={`${card.name}, value $${card.value}M`}
      >
        <div className={cn("relative flex items-center justify-center px-1.5", s.bannerH, c.banner)}>
          <span className={cn("font-black uppercase text-center leading-tight text-white drop-shadow-sm", s.nameText)}>
            {card.name}
          </span>
        </div>
        <div className={cn(
          "absolute left-1/2 -translate-x-1/2 flex items-center justify-center rounded-full bg-white font-black border border-[oklch(0.20_0.01_260)] z-10",
          size === "md" ? "h-6 w-6 text-[8px] top-[20px]" : "h-3.5 w-3.5 text-[5px] top-[9px]"
        )}>
          {card.value}M
        </div>
        <div className={cn("flex flex-1 flex-col bg-white", size === "md" ? "px-1.5 pt-3 pb-1" : "px-0.5 pt-1 pb-0.5")}>
          {size === "md" && (
            <div className="flex flex-1 flex-col rounded-lg border border-[oklch(0.85_0.01_260)] bg-[oklch(0.97_0.003_260)] px-2 py-1">
              <p className="text-[7px] font-bold uppercase tracking-wider text-[oklch(0.40_0.01_260)] mb-0.5 text-center">Rent</p>
              <div className="flex flex-col gap-px flex-1 justify-center">
                {card.rentTable.map((r) => (
                  <div key={r.cards} className="flex items-center justify-between">
                    <span className="text-[7px] text-[oklch(0.35_0.01_260)]">{r.cards} Card{r.cards > 1 ? "s" : ""}</span>
                    <span className="text-[8px] font-black text-[oklch(0.20_0.01_260)]">${r.rent}M</span>
                  </div>
                ))}
              </div>
              <p className="text-[6px] text-center text-muted-foreground mt-0.5">{card.setRequired} to complete</p>
            </div>
          )}
        </div>
      </button>
    )
  }

  /* RENT CARD */
  if (isRentCard(card)) {
    const isWild = isWildRentCard(card)
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "card-lift relative flex flex-col items-center justify-center overflow-hidden rounded-xl",
          CARD_OUTLINE, s.wrapper, selectionRing,
          isWild
            ? "bg-[linear-gradient(135deg,oklch(0.58_0.24_25)_0%,oklch(0.75_0.18_60)_20%,oklch(0.65_0.20_130)_40%,oklch(0.50_0.20_200)_60%,oklch(0.45_0.22_280)_80%,oklch(0.60_0.22_330)_100%)]"
            : "bg-[oklch(0.92_0.03_260)]",
          onClick && "cursor-pointer"
        )}
        aria-label={`Rent card, value $${card.value}M`}
      >
        <div className={cn(
          "absolute right-1.5 top-1.5 flex items-center justify-center rounded-full bg-white font-black border border-[oklch(0.20_0.01_260)] z-10",
          size === "md" ? "h-5 w-5 text-[7px]" : "h-3.5 w-3.5 text-[5px]"
        )}>
          {card.value}M
        </div>
        <DollarSign className={cn("mb-1", isWild ? "text-white" : "text-[oklch(0.30_0.02_260)]", size === "md" ? "h-5 w-5" : "h-2.5 w-2.5")} aria-hidden="true" />
        <span className={cn(
          "font-black uppercase text-center leading-tight drop-shadow-sm px-2",
          isWild ? "text-white" : "text-[oklch(0.25_0.02_260)]",
          size === "md" ? "text-[9px]" : "text-[5px]"
        )}>
          {isWild ? "WILD RENT" : "RENT"}
        </span>
        {size === "md" && !isWild && Array.isArray(card.colors) && (
          <div className="flex gap-1 mt-1.5">
            {card.colors.map((col) => (
              <div key={col} className={cn("h-3 w-6 rounded-sm", colorMap[col]?.banner ?? "bg-muted")} />
            ))}
          </div>
        )}
        {size === "md" && isWild && (
          <p className="text-[7px] text-center text-white mt-1 px-2" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
            Use on any color set
          </p>
        )}
      </button>
    )
  }

  /* PROPERTY WILDCARD */
  if (isPropertyWildcard(card)) {
    const isMulti = card.colors === "multi"
    if (!isMulti && Array.isArray(card.colors) && card.colors.length === 2) {
      const [topColor, bottomColor] = card.colors
      const topMap = colorMap[topColor]
      const bottomMap = colorMap[bottomColor]

      // Get rent table for each color from rentProfiles (using index order)
      const topRentTable = card.rentProfiles?.[0]?.rentTable ?? []
      const bottomRentTable = card.rentProfiles?.[1]?.rentTable ?? []

      if (size === "md") {
        return (
          <button
            type="button"
            onClick={onClick}
            className={cn(
              "card-lift relative flex flex-col overflow-hidden rounded-xl bg-white",
              CARD_OUTLINE, s.wrapper, selectionRing,
              onClick && "cursor-pointer"
            )}
            aria-label={`Property wildcard: ${topColor}/${bottomColor}`}
          >
            {/* TOP COLOR BAR - Reduced height */}
            <div className={cn("flex items-center justify-center flex-shrink-0", topMap.banner)} style={{ height: "24%" }}>
              <span className="text-[7px] font-black uppercase text-white drop-shadow-sm text-center leading-tight">WILD PROPERTY</span>
            </div>

            {/* CENTER WHITE SECTION */}
            <div className="flex-1 relative flex flex-col items-center justify-center px-1.5 py-1">
              {/* Value circle - positioned halfway between color bar and center box */}
              <div className={cn(
                "absolute -top-3 left-1/2 -translate-x-1/2 flex items-center justify-center rounded-full bg-white font-black border-2 border-[oklch(0.20_0.01_260)] z-10",
                "h-6 w-6 text-[8px]"
              )}>
                {card.value}M
              </div>

              {/* Single merged grey rent box with side-by-side tables */}
              <div className="flex-1 w-full flex flex-col rounded-md bg-slate-100 border border-slate-300 px-0.5 pt-2 pb-2 overflow-hidden mb-0">
                <p className="text-[7px] font-bold uppercase text-slate-700 mb-1">Rent</p>

                {/* Both rent tables displayed inline */}
                <div className="flex justify-between items-start text-[5.5px]">
                  {/* Top color rent table - left side */}
                  <div className="flex justify-center gap-1 flex-1">
                    {/* Cards column */}
                    <div className="flex flex-col items-center">
                      <p className="text-[5px] font-bold text-slate-600 mb-0.55">Cards</p>
                      {topRentTable.map((r) => (
                        <p key={`top-${r.cards}`} className="font-bold text-slate-800 leading-none">{r.cards}</p>
                      ))}
                    </div>
                    {/* Rent column */}
                    <div className="flex flex-col items-center">
                      <p className="text-[5px] font-bold text-slate-600 mb-0.0">Rent</p>
                      {topRentTable.map((r) => (
                        <p key={`top-rent-${r.cards}`} className="font-bold text-slate-900 leading-none">${r.rent}M</p>
                      ))}
                    </div>
                  </div>

                  {/* Divider line */}
                  <div className="border-l border-slate-400 mx-1"></div>

                  {/* Bottom color rent table - right side (rotated) */}
                  <div className="flex justify-center gap-1 flex-1 rotate-180">
                    {/* Cards column */}
                    <div className="flex flex-col items-center">
                      <p className="text-[5px] font-bold text-slate-600 mb-0.50">Cards</p>
                      {bottomRentTable.map((r) => (
                        <p key={`bottom-${r.cards}`} className="font-bold text-slate-800 leading-none">{r.cards}</p>
                      ))}
                    </div>
                    {/* Rent column */}
                    <div className="flex flex-col items-center">
                      <p className="text-[5px] font-bold text-slate-600 mb-0.50">Rent</p>
                      {bottomRentTable.map((r) => (
                        <p key={`bottom-rent-${r.cards}`} className="font-bold text-slate-900 leading-none">${r.rent}M</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM COLOR BAR - Rotated 180° */}
            <div className={cn("flex items-center justify-center flex-shrink-0 rotate-180", bottomMap.banner)} style={{ height: "24%" }}>
              <span className="text-[7px] font-black uppercase text-white drop-shadow-sm text-center leading-tight">WILD PROPERTY</span>
            </div>
          </button>
        )
      }

      return (
        <button
          type="button"
          onClick={onClick}
          className={cn(
            "card-lift relative flex flex-col overflow-hidden rounded-xl",
            CARD_OUTLINE, s.wrapper, selectionRing,
            onClick && "cursor-pointer"
          )}
          aria-label={`Property wildcard: ${topColor}/${bottomColor}`}
        >
          <div className={cn("flex-1 flex flex-col items-center justify-center relative", topMap.banner)}>
            <span className="text-[4px] font-black uppercase text-white drop-shadow-sm">WILD</span>
          </div>
          <div className={cn("absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full bg-white font-black border border-[oklch(0.20_0.01_260)] z-10", "h-3.5 w-3.5 text-[5px]")}>
            M{card.value}
          </div>
          <div className={cn("flex-1 flex flex-col items-center justify-center", bottomMap.banner)}>
            <span className="text-[4px] font-black uppercase text-white drop-shadow-sm">WILD</span>
          </div>
        </button>
      )
    }
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "card-lift relative flex flex-col items-center justify-center overflow-hidden rounded-xl",
          CARD_OUTLINE, s.wrapper, selectionRing,
          isMulti
            ? "bg-[linear-gradient(135deg,oklch(0.58_0.24_25)_0%,oklch(0.75_0.18_60)_20%,oklch(0.65_0.20_130)_40%,oklch(0.50_0.20_200)_60%,oklch(0.45_0.22_280)_80%,oklch(0.60_0.22_330)_100%)]"
            : "bg-white",
          onClick && "cursor-pointer"
        )}
        aria-label={`Property wildcard${isMulti ? " (multi-color)" : ""}`}
      >
        <Shuffle className={cn("mb-1", isMulti ? "text-white" : "text-[oklch(0.30_0.02_260)]", size === "md" ? "h-5 w-5" : "h-2.5 w-2.5")} aria-hidden="true" />
        <span className={cn(
          "font-black uppercase text-center leading-tight px-1",
          isMulti ? "text-white drop-shadow-sm" : "text-[oklch(0.25_0.02_260)]",
          size === "md" ? "text-[8px]" : "text-[5px]"
        )}>
          {isMulti ? "WILD" : "WILDCARD"}
        </span>
        {size === "md" && isMulti && (
          <p className="text-[7px] text-center text-white mt-1 px-2" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}>
            Place on any set
          </p>
        )}
      </button>
    )
  }

  /* ACTION CARD */
  if (isActionCard(card)) {
    const solidBg = actionBg(card.name)
    const IconComponent = getActionIcon(card.name)
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "card-lift relative flex flex-col items-center justify-center overflow-hidden rounded-xl",
          CARD_OUTLINE, s.wrapper, solidBg, selectionRing,
          onClick && "cursor-pointer"
        )}
        aria-label={`Action: ${card.name}, value $${card.value}M`}
      >
        <div className={cn(
          "absolute right-1.5 top-1.5 flex items-center justify-center rounded-full bg-white font-black border border-[oklch(0.20_0.01_260)] z-10",
          size === "md" ? "h-5 w-5 text-[7px]" : "h-3.5 w-3.5 text-[5px]"
        )}>
          {card.value}M
        </div>
        <IconComponent className={cn("text-white mb-1", size === "md" ? "h-5 w-5" : "h-2.5 w-2.5")} aria-hidden="true" />
        <span className={cn(
          "font-black uppercase text-center leading-tight text-white drop-shadow-sm px-2",
          size === "md" ? "text-[9px]" : "text-[5px]"
        )}>
          {card.name}
        </span>
        {size === "md" && (
          <p className="text-[7px] text-center leading-snug text-white px-2 mt-1.5 max-w-full" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
            {card.description}
          </p>
        )}
      </button>
    )
  }

  /* MONEY CARD */
  if (isMoneyCard(card)) {
    const mc = moneyColor(card.value)
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "card-lift relative flex flex-col items-center justify-center overflow-hidden rounded-xl",
          CARD_OUTLINE, s.wrapper, mc, selectionRing,
          onClick && "cursor-pointer"
        )}
        aria-label={`Money card: $${card.value}M`}
      >
        <Banknote className={cn("mb-1", size === "md" ? "h-5 w-5" : "h-2.5 w-2.5")} aria-hidden="true" />
        <span className={cn("font-black", size === "md" ? "text-2xl" : "text-[8px]")}>
          {card.value}M
        </span>
        {size === "md" && (
          <span className="text-[7px] font-bold uppercase tracking-wider mt-0.5 opacity-70">Bank It</span>
        )}
      </button>
    )
  }

  return null
}
