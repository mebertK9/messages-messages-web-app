/**
 * The logged-in user's id, as stored by LoginPage. Used to tell "my"
 * wishes apart from the household's, since only the creator of a wish
 * may retract it.
 */
export function getCurrentUserId(): string | undefined {
  return (JSON.parse(localStorage.getItem("currentUser") ?? "{}") as { id?: string })
    .id;
}
