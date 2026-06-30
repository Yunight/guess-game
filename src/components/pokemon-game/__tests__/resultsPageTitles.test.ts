import { describe, expect, it } from "vitest";
import { getAvailableTitles, getRandomTitle } from "../resultsPageTitles";

const t = (key: string): string => key;

describe("getAvailableTitles", () => {
	it("returns grandmaster and legendary titles at 0%", () => {
		const titles = getAvailableTitles(0, t);
		expect(titles).toHaveLength(10);
		expect(titles[0]).toBe("prestigeTitles.grandmaster.0");
		expect(titles[5]).toBe("prestigeTitles.legendary.0");
	});

	it("returns champion titles at 5%", () => {
		const titles = getAvailableTitles(5, t);
		expect(titles).toHaveLength(5);
		expect(titles[0]).toBe("prestigeTitles.champion.0");
	});

	it("returns elite titles at 10%", () => {
		expect(getAvailableTitles(10, t)[0]).toBe("prestigeTitles.elite.0");
	});

	it("returns master titles at 15%", () => {
		expect(getAvailableTitles(15, t)[0]).toBe("prestigeTitles.master.0");
	});

	it("returns expert titles at 20%", () => {
		expect(getAvailableTitles(20, t)[0]).toBe("prestigeTitles.expert.0");
	});

	it("returns advanced titles at 25%", () => {
		expect(getAvailableTitles(25, t)[0]).toBe("prestigeTitles.advanced.0");
	});

	it("returns skilled titles at 30%", () => {
		expect(getAvailableTitles(30, t)[0]).toBe("prestigeTitles.skilled.0");
	});

	it("returns experienced titles at 35%", () => {
		expect(getAvailableTitles(35, t)[0]).toBe("prestigeTitles.experienced.0");
	});

	it("returns intermediate titles at 40%", () => {
		expect(getAvailableTitles(40, t)[0]).toBe("prestigeTitles.intermediate.0");
	});

	it("returns novice titles at 45%", () => {
		expect(getAvailableTitles(45, t)[0]).toBe("prestigeTitles.novice.0");
	});

	it("returns beginner titles at 50%", () => {
		expect(getAvailableTitles(50, t)[0]).toBe("prestigeTitles.beginner.0");
	});

	it("returns initiate titles at 60%", () => {
		expect(getAvailableTitles(60, t)[0]).toBe("prestigeTitles.initiate.0");
	});

	it("returns junior titles at 65%", () => {
		expect(getAvailableTitles(65, t)[0]).toBe("prestigeTitles.junior.0");
	});

	it("returns cadet titles at 70%", () => {
		expect(getAvailableTitles(70, t)[0]).toBe("prestigeTitles.cadet.0");
	});

	it("returns student titles at 75%", () => {
		expect(getAvailableTitles(75, t)[0]).toBe("prestigeTitles.student.0");
	});

	it("returns trainee titles at 80%", () => {
		expect(getAvailableTitles(80, t)[0]).toBe("prestigeTitles.trainee.0");
	});

	it("returns apprentice titles at 85%", () => {
		expect(getAvailableTitles(85, t)[0]).toBe("prestigeTitles.apprentice.0");
	});

	it("returns starter titles at 90%", () => {
		expect(getAvailableTitles(90, t)[0]).toBe("prestigeTitles.starter.0");
	});

	it("returns starter titles as fallback above 90%", () => {
		expect(getAvailableTitles(95, t)[0]).toBe("prestigeTitles.starter.0");
	});
});

describe("getRandomTitle", () => {
	it("returns a title from the available list", () => {
		const titles = ["title-a", "title-b", "title-c"];
		const result = getRandomTitle(titles);
		expect(titles).toContain(result);
	});
});
