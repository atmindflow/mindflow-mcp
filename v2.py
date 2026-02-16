import time
import logging
from threading import Thread
from typing import List, Callable

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class Task:
    def __init__(self, name: str, action: Callable):
        self.name = name
        self.action = action
        self.completed = False

    def execute(self):
        logging.info(f"Executing task: {self.name}")
        try:
            self.action()
            self.completed = True
            logging.info(f"Task {self.name} completed")
        except Exception as e:
            logging.error(f"Task {self.name} failed: {str(e)}")

class Agent:
    def __init__(self, name: str):
        self.name = name
        self.tasks: List[Task] = []

    def add_task(self, task: Task):
        logging.info(f"Agent {self.name} adding task: {task.name}")
        self.tasks.append(task)

    def run(self):
        logging.info(f"Agent {self.name} starting...")
        for task in self.tasks:
            task.execute()
        logging.info(f"Agent {self.name} finished all tasks")

class Scheduler:
    def __init__(self):
        self.agents: List[Agent] = []

    def add_agent(self, agent: Agent):
        self.agents.append(agent)

    def start(self):
        threads = []
        for agent in self.agents:
            thread = Thread(target=agent.run)
            threads.append(thread)
            thread.start()
        for t in threads:
            t.join()

# Example usage
if __name__ == "__main__":
    def task_a():
        print("Running Task A...")

    def task_b():
        print("Running Task B...")

    agent1 = Agent("AgentOne")
    agent2 = Agent("AgentTwo")

    agent1.add_task(Task("TaskA", task_a))
    agent2.add_task(Task("TaskB", task_b))

    scheduler = Scheduler()
    scheduler.add_agent(agent1)
    scheduler.add_agent(agent2)
    scheduler.start()
