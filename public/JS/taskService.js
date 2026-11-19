/* ============ TASKFLOW — FIRESTORE TASK SERVICE ============ */
import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";

const TASKS_COLLECTION = "tasks";

export const TaskService = {
  /**
   * Listen to real-time updates on tasks collection
   * @param {function(Array): void} onUpdate Callback receiving task array
   * @param {function(Error): void} onError Callback on snapshot error
   * @returns {function(): void} Unsubscribe function
   */
  subscribeTasks(onUpdate, onError) {
    const q = query(collection(db, TASKS_COLLECTION));
    return onSnapshot(
      q,
      (snapshot) => {
        const tasks = [];
        snapshot.forEach((docSnap) => {
          tasks.push({
            id: docSnap.id,
            ...docSnap.data()
          });
        });
        onUpdate(tasks);
      },
      (error) => {
        console.error("Firestore onSnapshot error:", error);
        if (onError) onError(error);
      }
    );
  },

  /**
   * Retrieve all tasks from Firestore once
   * @returns {Promise<Array>}
   */
  async getTasks() {
    try {
      const q = query(collection(db, TASKS_COLLECTION));
      const snapshot = await getDocs(q);
      const tasks = [];
      snapshot.forEach((docSnap) => {
        tasks.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });
      return tasks;
    } catch (error) {
      console.error("Firestore getTasks error:", error);
      throw error;
    }
  },

  /**
   * Create a new task in Firestore using addDoc() with auto-generated ID
   * @param {Object} task Task data
   * @returns {Promise<string>} Created document ID
   */
  async createTask(task) {
    try {
      const isCompleted = task.status === "completed" || task.completed === true;
      const docData = {
        title: (task.title || "").trim(),
        description: (task.description || "").trim(),
        dueDate: task.dueDate || "",
        priority: task.priority || "medium",
        category: task.category || "",
        status: isCompleted ? "completed" : (task.status || "todo"),
        completed: isCompleted,
        completedAt: isCompleted ? (task.completedAt || new Date().toISOString().slice(0, 10)) : null,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, TASKS_COLLECTION), docData);
      return docRef.id;
    } catch (error) {
      console.error("Firestore addDoc error:", error);
      throw error;
    }
  },

  /**
   * Update an existing task document in Firestore using updateDoc()
   * @param {string} id Document ID
   * @param {Object} data Fields to update
   * @returns {Promise<void>}
   */
  async updateTask(id, data) {
    try {
      const docRef = doc(db, TASKS_COLLECTION, id);
      const updateData = {};

      if (data.title !== undefined) updateData.title = data.title.trim();
      if (data.description !== undefined) updateData.description = (data.description || "").trim();
      if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
      if (data.priority !== undefined) updateData.priority = data.priority;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.status !== undefined) {
        updateData.status = data.status;
        updateData.completed = data.status === "completed";
      }
      if (data.completed !== undefined) {
        updateData.completed = Boolean(data.completed);
        if (data.status === undefined) {
          updateData.status = data.completed ? "completed" : "todo";
        }
      }
      if (data.completedAt !== undefined) {
        updateData.completedAt = data.completedAt;
      }

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error("Firestore updateDoc error:", error);
      throw error;
    }
  },

  /**
   * Delete a task document in Firestore using deleteDoc()
   * @param {string} id Document ID
   * @returns {Promise<void>}
   */
  async deleteTask(id) {
    try {
      const docRef = doc(db, TASKS_COLLECTION, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Firestore deleteDoc error:", error);
      throw error;
    }
  }
};

window.TaskService = TaskService;
