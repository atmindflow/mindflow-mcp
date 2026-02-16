import time
import logging
from typing import List

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class Task:
    def __init__(self, name: str, action):
        self.name = name
        self.action = action
        self.completed = False

    def execute(self):
        logging.info(f"Executing task: {self.name}")
        try:
            self.action()
            self.completed = True
            logging.info(f"Task {self.name} completed successfully")
        except Exception as e:
            logging.error(f"Task {self.name} failed: {str(e)}")

class Agent:
    def __init__(self, name: str):
        self.name = name
        self.tasks: List[Task] = []

    def add_task(self, task: Task):
        logging.info(f"Adding task: {task.name}")
        self.tasks.append(task)

    def run(self):
        logging.info(f"Agent {self.name} starting...")
        for task in self.tasks:
            task.execute()
        logging.info(f"Agent {self.name} finished all tasks")

# Example usage
if __name__ == "__main__":
    def sample_task():
        print("Performing sample automation...")

    agent = Agent("TestAgent")
    agent.add_task(Task("SampleTask", sample_task))
    agent.run()
