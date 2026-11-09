// Picks an icon name for a specialty from its name
export function specialtyIcon(name) {
  const text = String(name).toLowerCase();
  if (text.includes("cardio") || text.includes("heart")) return "heart";
  if (text.includes("pediatr") || text.includes("child")) return "smile";
  if (text.includes("dermat") || text.includes("skin")) return "droplet";
  if (text.includes("eye") || text.includes("ophthal")) return "eye";
  return "activity";
}