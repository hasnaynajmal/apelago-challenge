// Country names and SVG flags (Windows can't render flag emoji). Only countries relevant to the ecosystem are bundled.
import {
  AT, AU, BE, BR, CA, CH, CL, CN, CY, CZ, DE, DK, EE, ES, FI, FR, GB, GR, HR, IE, IL, IN, IS, IT, JP, KE, KR, LT, LU, LV,
  MC, MT, NG, NL, NO, NZ, PL, PT, RO, SE, SG, SI, SK, UA, US, ZA,
} from "country-flag-icons/react/3x2";
import { cn } from "@/lib/utils";

export const COUNTRIES = [
  ["FI", "Finland", FI], ["SE", "Sweden", SE], ["NO", "Norway", NO], ["DK", "Denmark", DK], ["IS", "Iceland", IS],
  ["EE", "Estonia", EE], ["LV", "Latvia", LV], ["LT", "Lithuania", LT], ["DE", "Germany", DE], ["PL", "Poland", PL],
  ["NL", "Netherlands", NL], ["BE", "Belgium", BE], ["LU", "Luxembourg", LU], ["FR", "France", FR], ["GB", "United Kingdom", GB],
  ["IE", "Ireland", IE], ["ES", "Spain", ES], ["PT", "Portugal", PT], ["IT", "Italy", IT], ["MT", "Malta", MT],
  ["GR", "Greece", GR], ["CY", "Cyprus", CY], ["HR", "Croatia", HR], ["SI", "Slovenia", SI], ["AT", "Austria", AT],
  ["CH", "Switzerland", CH], ["CZ", "Czechia", CZ], ["SK", "Slovakia", SK], ["RO", "Romania", RO], ["UA", "Ukraine", UA],
  ["MC", "Monaco", MC], ["US", "United States", US], ["CA", "Canada", CA], ["BR", "Brazil", BR], ["CL", "Chile", CL],
  ["IL", "Israel", IL], ["IN", "India", IN], ["SG", "Singapore", SG], ["JP", "Japan", JP], ["KR", "South Korea", KR],
  ["CN", "China", CN], ["AU", "Australia", AU], ["NZ", "New Zealand", NZ], ["ZA", "South Africa", ZA], ["KE", "Kenya", KE],
  ["NG", "Nigeria", NG],
] as const;

type Code = (typeof COUNTRIES)[number][0];
const BY_CODE = new Map<string, (typeof COUNTRIES)[number]>(COUNTRIES.map((c) => [c[0], c]));

export const countryName = (code: string | null | undefined) => (code ? BY_CODE.get(code.toUpperCase())?.[1] ?? code : null);

export function Flag({ code, className }: { code: string | null | undefined; className?: string }) {
  const entry = code ? BY_CODE.get(code.toUpperCase()) : undefined;
  if (!entry) return null;
  const Svg = entry[2];
  return <Svg title={entry[1]} className={cn("inline-block h-3.5 w-auto shrink-0 rounded-[2px] shadow-[0_0_0_1px_rgb(0_0_0/0.08)]", className)} />;
}

/** Flag + full country name, e.g. 🇫🇮 Finland. */
export function CountryLabel({ code, city, className }: { code: string | null | undefined; city?: string | null; className?: string }) {
  if (!code && !city) return null;
  const name = countryName(code);
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <Flag code={code} />
      <span>{[city, name].filter(Boolean).join(", ")}</span>
    </span>
  );
}

export type CountryCode = Code;
