import time
import logging
from threading import Thread
from typing import List, Callable, Dict, Any

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class Task:
    def __init__(self, name: str, action: Callable[[Dict[str, Any]], None], params: Dict[str, Any] = {}):
        self.name = name
        self.action = action
        self.params = params
        self.completed = False

    def execute(self):
        logging.info(f"Executing task: {self.name} with params {self.params}")
        try:
            self.action(self.params)
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

# Example dynamic tasks
def print_message(params):
    message = params.get("message", "Hello")
    times = params.get("times", 1)
    for _ in range(times):
        print(message)
        time.sleep(0.5)

def compute_sum(params):
    a = params.get("a", 0)
    b = params.get("b", 0)
    print(f"Sum of {a} + {b} = {a + b}")

# Example usage
if __name__ == "__main__":
    agent1 = Agent("LoggerAgent")
    agent2 = Agent("ComputeAgent")

    agent1.add_task(Task("PrintTask", print_message, {"message": "Agentic is live!", "times": 3}))
    agent2.add_task(Task("SumTask", compute_sum, {"a": 7, "b": 5}))

    scheduler = Scheduler()
    scheduler.add_agent(agent1)
    scheduler.add_agent(agent2)
    scheduler.start()
