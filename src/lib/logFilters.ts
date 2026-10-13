/**
 * Build the Prisma `where` clause for admin step-log queries from URL search params.
 * Shared by the admin logs list and the Excel export so both always see the same rows.
 *
 * Supported params: `dates` (comma-separated YYYY-MM-DD, takes priority),
 * `startDate` / `endDate`, `userId`, `search` (name, email or department).
 */
export function buildAdminLogsWhere(searchParams: URLSearchParams) {
  const search = searchParams.get("search")?.trim() || "";
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");
  const datesParam = searchParams.get("dates");
  const userIdParam = searchParams.get("userId");

  const where: any = {};

  // Date filters
  if (datesParam && datesParam.trim().length > 0) {
    const selectedDateStrings = Array.from(
      new Set(
        datesParam
          .split(",")
          .map((s) => s.trim())
          .filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s))
      )
    );

    if (selectedDateStrings.length > 0) {
      const selectedDateObjs = selectedDateStrings.map((dStr) => {
        const [y, m, d] = dStr.split("-").map(Number);
        return new Date(Date.UTC(y, m - 1, d));
      });
      where.date = { in: selectedDateObjs };
    }
  } else if (startDateParam || endDateParam) {
    const dateFilter: any = {};
    if (startDateParam) {
      const s = new Date(startDateParam);
      dateFilter.gte = new Date(Date.UTC(s.getFullYear(), s.getMonth(), s.getDate()));
    }
    if (endDateParam) {
      const e = new Date(endDateParam);
      dateFilter.lte = new Date(Date.UTC(e.getFullYear(), e.getMonth(), e.getDate()));
    }
    where.date = dateFilter;
  }

  // User filter
  if (userIdParam) {
    where.userId = userIdParam;
  }

  // Search filter across user name or email
  if (search) {
    where.user = {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { department: { contains: search, mode: "insensitive" } },
      ],
    };
  }

  return where;
}
