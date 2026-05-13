from __future__ import annotations

import json
import re
from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).parent
SOURCE_HTML = ROOT / "texas_longhorns_seasons.html"
OUTPUT_JS = ROOT / "data.js"


class WikipediaTableParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.in_table = False
        self.capture = False
        self.table_depth = 0
        self.rows: list[list[str]] = []
        self.current_row: list[str] | None = None
        self.current_cell: str | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attrs_dict = dict(attrs)
        if tag == "table":
            classes = attrs_dict.get("class", "")
            if "wikitable" in classes and not self.in_table:
                self.in_table = True
                self.capture = True
                self.table_depth = 1
            elif self.in_table:
                self.table_depth += 1
        elif self.capture and tag == "tr":
            self.current_row = []
        elif self.capture and tag in ("td", "th"):
            self.current_cell = ""
        elif self.capture and tag == "br" and self.current_cell is not None:
            self.current_cell += " "

    def handle_endtag(self, tag: str) -> None:
        if tag == "table" and self.in_table:
            self.table_depth -= 1
            if self.table_depth == 0:
                self.in_table = False
                self.capture = False
        elif self.capture and tag in ("td", "th") and self.current_cell is not None:
            self.current_row.append(" ".join(self.current_cell.split()))
            self.current_cell = None
        elif self.capture and tag == "tr" and self.current_row is not None:
            if any(cell.strip() for cell in self.current_row):
                self.rows.append(self.current_row)
            self.current_row = None

    def handle_data(self, data: str) -> None:
        if self.capture and self.current_cell is not None:
            self.current_cell += data


def parse_record(record: str) -> tuple[int, int, int]:
    cleaned = re.sub(r"\[[^\]]+\]", "", record)
    numbers = [int(value) for value in re.findall(r"\d+", cleaned)]
    wins = numbers[0]
    losses = numbers[1]
    ties = numbers[2] if len(numbers) > 2 else 0
    return wins, losses, ties


def build_dataset() -> dict:
    parser = WikipediaTableParser()
    parser.feed(SOURCE_HTML.read_text(errors="ignore"))

    season_rows = [row for row in parser.rows if row and row[0].isdigit() and len(row) >= 3]
    seasons = []
    for row in season_rows:
        wins, losses, ties = parse_record(row[2])
        games = wins + losses + ties
        seasons.append(
            {
                "year": int(row[0]),
                "coach": row[1],
                "overall": row[2],
                "wins": wins,
                "losses": losses,
                "ties": ties,
                "games": games,
                "winPct": round((wins + 0.5 * ties) / games, 4),
            }
        )

    windows = []
    for index in range(len(seasons) - 3):
        chunk = seasons[index : index + 4]
        wins = sum(season["wins"] for season in chunk)
        losses = sum(season["losses"] for season in chunk)
        ties = sum(season["ties"] for season in chunk)
        games = wins + losses + ties
        win_pct = round((wins + 0.5 * ties) / games, 4)
        record = f"{wins}-{losses}" + (f"-{ties}" if ties else "")
        coach_names = list(dict.fromkeys(season["coach"] for season in chunk))
        windows.append(
            {
                "startYear": chunk[0]["year"],
                "endYear": chunk[-1]["year"],
                "record": record,
                "wins": wins,
                "losses": losses,
                "ties": ties,
                "games": games,
                "winPct": win_pct,
                "coachLabel": ", ".join(coach_names),
                "seasonRecords": [
                    {
                        "year": season["year"],
                        "record": season["overall"],
                        "coach": season["coach"],
                    }
                    for season in chunk
                ],
            }
        )

    best = sorted(windows, key=lambda item: (-item["winPct"], -item["wins"], item["losses"], item["startYear"]))
    worst = sorted(windows, key=lambda item: (item["winPct"], item["wins"], -item["losses"], item["startYear"]))

    return {
        "source": "https://en.wikipedia.org/wiki/List_of_Texas_Longhorns_football_seasons",
        "generatedFrom": SOURCE_HTML.name,
        "rankingMethod": "Rolling four-season windows ranked by win percentage, with ties counted as half a win.",
        "seasonCount": len(seasons),
        "windowCount": len(windows),
        "bestWindow": best[0],
        "worstWindow": worst[0],
        "topFiveBest": best[:5],
        "topFiveWorst": worst[:5],
        "windows": windows,
    }


def main() -> None:
    dataset = build_dataset()
    OUTPUT_JS.write_text(
        "window.longhornData = " + json.dumps(dataset, indent=2) + ";\n",
        encoding="utf-8",
    )
    print(f"Wrote {OUTPUT_JS}")


if __name__ == "__main__":
    main()
