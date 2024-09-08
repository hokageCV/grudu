"use client";
import React, { useState, useEffect } from "react";
import { useMutation, useQuery, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { BASE_URL } from "@/constant/constants";
import { UserType } from "@/context/authStore";
import Navbar from "./Navbar";

const queryClient = new QueryClient();

export default function AllTasks() {
  return (
    <QueryClientProvider client={queryClient}>
      <AllTasksContent />
    </QueryClientProvider>
  );
}

function AllTasksContent() {
  const [taskName, setTaskName] = useState<string>("");
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [editTaskName, setEditTaskName] = useState<string>("");
  const [user, setUser] = useState<UserType | null>(null);
  const { taskID } = useParams();

  useEffect(() => {
    const storedUser = localStorage.getItem("user-storage");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser.state.user);
    }
  }, []);

  const createTaskMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${BASE_URL}/tasks`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'uid': user?.uid || '',
          'client': user?.client || '',
          'access-token': user?.accessToken || '',
        },
        body: JSON.stringify({ name: taskName, task_list_id: taskID[0] }),
      });

      if (!response.ok) {
        throw new Error("Failed to create task");
      }
      return response.json();
    },
    onSuccess: () => {
      setTaskName("");
      refetch();
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (task: { id: string; name: string; completed: boolean }) => {
      const response = await fetch(`${BASE_URL}/tasks/${task.id}`, {
        method: "PATCH",
        headers: {
          'Content-Type': 'application/json',
          'uid': user?.uid || '',
          'client': user?.client || '',
          'access-token': user?.accessToken || '',
        },
        body: JSON.stringify(task),
      });

      if (!response.ok) {
        throw new Error("Failed to update task");
      }
      return response.json();
    },
    onSuccess: () => {
      setEditTaskId(null);
      refetch();
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await fetch(`${BASE_URL}/tasks/${taskId}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json',
          'uid': user?.uid || '',
          'client': user?.client || '',
          'access-token': user?.accessToken || '',
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }
      return response.json();
    },
    onSuccess: () => {
      refetch();
    },
  });

  const handleCreateTask = () => {
    if (taskName) {
      createTaskMutation.mutate();
    }
  };

  const handleCheckboxChange = (task: { id: string; name: string; completed: boolean }) => {
    updateTaskMutation.mutate({ ...task, completed: !task.completed });
  };

  const handleEditTaskSave = (taskId: string, newName: string, currentCompleted: boolean) => {
    if (newName.trim() === "") return;
    updateTaskMutation.mutate({ id: taskId, name: newName, completed: currentCompleted });
    setEditTaskId(null);
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTaskMutation.mutate(taskId);
  };

  const { data: tasks, isLoading, isError, refetch } = useQuery({
    queryKey: ["tasks", taskID],
    queryFn: async () => {
      if (!taskID) return;
      const response = await fetch(`${BASE_URL}/tasks`, {
        method: "GET",
        headers: {
          'Content-Type': 'application/json',
          'uid': user?.uid || '',
          'client': user?.client || '',
          'access-token': user?.accessToken || '',
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }

      return await response.json();
    },
    enabled: !!user && !!taskID,
  });

  return (
    <div className="h-screen">
      {/* For small screens */}
      <div className="sm:hidden">
        <Navbar />
        <div className="flex justify-center p-4">
          <div className="w-full max-w-3xl">
            <div className="mb-4">
              <input
                type="text"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 mb-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                placeholder="Enter task name"
              />
              <button
                onClick={handleCreateTask}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-lg shadow transition"
              >
                Create Task
              </button>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Tasks</h3>
              {isLoading && <p>Loading tasks...</p>}
              {isError && <p>Failed to load tasks.</p>}
              <ul>
                {tasks
                  ?.filter((task: { id: string; name: string; task_list_id: number; completed: boolean }) => task.task_list_id === Number(taskID[0]))
                  .sort((a: { completed: boolean }, b: { completed: boolean }) => Number(a.completed) - Number(b.completed))
                  .map((task: { id: string; name: string; completed: boolean }) => (
                    <li key={task.id} className="border-b border-gray-300 py-2 flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => handleCheckboxChange(task)}
                          className="mr-2"
                        />
                        {editTaskId === task.id ? (
                          <input
                            type="text"
                            value={editTaskName}
                            onChange={(e) => setEditTaskName(e.target.value)}
                            className="border border-gray-300 rounded-lg px-2 py-1"
                            autoFocus
                          />
                        ) : (
                          <span>{task.name}</span>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        {editTaskId === task.id ? (
                          <button
                            onClick={() => handleEditTaskSave(task.id, editTaskName, task.completed)}
                            className="bg-green-500 hover:bg-green-600 text-white font-medium px-3 py-1 rounded-lg shadow transition"
                          >
                            Save
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setEditTaskId(task.id);
                              setEditTaskName(task.name);
                            }}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium px-3 py-1 rounded-lg shadow transition"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="bg-red-600 hover:bg-red-700 text-white font-medium px-3 py-1 rounded-lg shadow transition"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* For larger screens */}
      <div className="hidden sm:flex h-full">
        <div className="w-1/6 h-full bg-secondary">
          <Navbar />
        </div>
        <div className="w-5/6 h-full p-4">
          <div className="w-full max-w-3xl">
            <div className="mb-4">
              <input
                type="text"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 mb-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                placeholder="Enter task name"
              />
              <button
                onClick={handleCreateTask}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-lg shadow transition"
              >
                Create Task
              </button>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Tasks</h3>
              {isLoading && <p>Loading tasks...</p>}
              {isError && <p>Failed to load tasks.</p>}
              <ul>
                {tasks
                  ?.filter((task: { id: string; name: string; task_list_id: number; completed: boolean }) => task.task_list_id === Number(taskID[0]))
                  .sort((a: { completed: boolean }, b: { completed: boolean }) => Number(a.completed) - Number(b.completed))
                  .map((task: { id: string; name: string; completed: boolean }) => (
                    <li key={task.id} className="border-b border-gray-300 py-2 flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => handleCheckboxChange(task)}
                          className="mr-2"
                        />
                        {editTaskId === task.id ? (
                          <input
                            type="text"
                            value={editTaskName}
                            onChange={(e) => setEditTaskName(e.target.value)}
                            className="border border-gray-300 rounded-lg px-2 py-1"
                            autoFocus
                          />
                        ) : (
                          <span>{task.name}</span>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        {editTaskId === task.id ? (
                          <button
                            onClick={() => handleEditTaskSave(task.id, editTaskName, task.completed)}
                            className="bg-green-500 hover:bg-green-600 text-white font-medium px-3 py-1 rounded-lg shadow transition"
                          >
                            Save
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setEditTaskId(task.id);
                              setEditTaskName(task.name);
                            }}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium px-3 py-1 rounded-lg shadow transition"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="bg-red-600 hover:bg-red-700 text-white font-medium px-3 py-1 rounded-lg shadow transition"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}