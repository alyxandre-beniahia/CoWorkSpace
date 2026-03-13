/** Génère une URL DiceBear déterministe par userId (style bottts). */
export function getDiceBearAvatarUrl(userId: string): string {
  return `https://api.dicebear.com/9.x/bottts/svg?seed=${userId}`;
}
