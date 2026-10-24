# REPSTER — Built one rep at a time

**Live demo:** https://repster.vercel.app/

A responsive strength-training planner built with HTML, CSS, and vanilla JavaScript. Open `dist/index.html` to use it; there is no build step or account.

Plan sessions with exercises, sets, reps, and weights. In workout mode, check off sets, run a 60-second rest timer, and save the completed session to training history. A weekly target and light/dark theme help make progress visible. Workouts, set progress, history, target, and theme are stored in the browser on this device. A fresh browser starts with sample sessions so the full interface can be explored.

The site uses the approved REPSTER identity and the supplied gym photograph in its hero. The previous page is retained as `index-before-redesign.html` in the project folder for comparison.

## Datheon Task 2 mapping

REPSTER treats a planned workout session as a task. Users can create, view, edit, and delete sessions; assign a training category and date; mark sessions complete; and filter All, Active, or Completed. Quick search is included. Changes are saved immediately to localStorage. The app runs without a server, and the layout adapts to smaller screens. The workout timer, set log, history, and weekly target extend the required task manager behavior for the fitness use case.
