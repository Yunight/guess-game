import { describe, expect, it } from "vite-plus/test";
import { formatRankingDate, formatTimeForRanking } from "../gameFormatters";

describe("formatTimeForRanking", () => {
	it("formats seconds as m:ss", () => {
		expect(formatTimeForRanking(125)).toBe("2:05");
	});
});

describe("formatRankingDate", () => {
	it("formats a date as dd/mm/yyyy", () => {
		expect(formatRankingDate(new Date(2024, 0, 5))).toBe("05/01/2024");
	});
});
