package domain

import "time"

type Activity struct {
	Date  string
	Count int
}
type Statistics struct{ Mastered, Attempts, Streak, XP, Today, Due int }

func Summarize(progress []Progress, weights map[string]int, events []time.Time, timezone string, now time.Time) (Statistics, []Activity) {
	var stats Statistics
	for _, p := range progress {
		stats.Attempts += p.Attempts
		if p.BestScore.Mastered() {
			stats.Mastered++
		}
		stats.XP += weights[p.QuestionID] * int(p.BestScore) / 100
		if p.Due(now) {
			stats.Due++
		}
	}
	loc, err := time.LoadLocation(timezone)
	if err != nil {
		loc = time.UTC
	}
	today := now.In(loc)
	counts := map[string]int{}
	for _, event := range events {
		counts[event.In(loc).Format(time.DateOnly)]++
	}
	activity := make([]Activity, 0, 91)
	for i := 90; i >= 0; i-- {
		d := today.AddDate(0, 0, -i).Format(time.DateOnly)
		activity = append(activity, Activity{d, counts[d]})
	}
	stats.Today = counts[today.Format(time.DateOnly)]
	day := today
	if stats.Today == 0 {
		day = day.AddDate(0, 0, -1)
	}
	for i := 0; i < 366; i++ {
		if counts[day.Format(time.DateOnly)] == 0 {
			break
		}
		stats.Streak++
		day = day.AddDate(0, 0, -1)
	}
	return stats, activity
}
