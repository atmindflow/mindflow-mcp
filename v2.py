"""
Agentic Automation Engine - v1.1.0
Added Task Scheduler
"""

import time
import threading
from datetime import datetime


class TaskScheduler:
    """
    Simple scheduler that triggers agent tasks at intervals.
    """

    def __init__(self, interval_seconds: int):
        self.interval = interval_seconds
        self.running = False

    def start(self, task_callable):
        self.running = True
        while self.running:
            task_callable()
            time.sleep(self.interval)

    def stop(self):
        self.running = False


class AutonomousAgent:
    def __init__(self, name: str, goal: str):
        self.name = name
        self.goal = goal

    def log(self, message: str):
        timestamp = datetime.utcnow().isoformat()
        print(f"[{timestamp}] [{self.name}] {message}")

    def execute_cycle(self):
        self.log("Analyzing state...")
        self.log("Planning task...")
        self.log("Executing workflow optimization...")


if __name__ == "__main__":
    agent = AutonomousAgent(
        name="ScheduledAgent",
        goal="Continuous process optimization"
    )

    scheduler = TaskScheduler(interval_seconds=3)

    try:
        scheduler_thread = threading.Thread(
            target=scheduler.start,
            args=(agent.execute_cycle,)
        )
        scheduler_thread.start()

        time.sleep(10)

    finally:
        scheduler.stop()
