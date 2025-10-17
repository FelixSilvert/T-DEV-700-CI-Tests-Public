"use client";

import { useEffect, useState } from "react";
import Button from "@/component/button";
import Card, { type Session } from "@/component/card";
import type { Entry } from "@/component/card";

export default function DashboardPage() {
  const [time, setTime] = useState<Date | null>(null);
  const [status, setStatus] = useState<"none" | "in" | "out">("none");

  const [entries] = useState<Entry[]>([
    { id: 1, date: "Friday 20/10/25, 8:50:56 AM", time: "8:50", type: "in" },
    { id: 2, date: "Friday 20/10/25, 12:05:12 PM", time: "12:05", type: "out" },
    { id: 3, date: "Friday 20/10/25, 13:59:09 PM", time: "13:59", type: "in" },
    { id: 4, date: "Friday 20/10/25, 17:22:44 PM", time: "17:22", type: "out" },
    { id: 5, date: "Thursday 19/10/25, 8:52:12 AM", time: "8:52", type: "in" },
    { id: 6, date: "Thursday 19/10/25, 17:18:36 PM", time: "17:18", type: "out" },
  ]);

  useEffect(() => {
    const updateTime = () => setTime(new Date());
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const formattedDate = time
    ? time.toLocaleString("fr", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "Synchronizing time…";

  const sessions: Session[] = [];
  for (let i = 0; i < [...entries].length; i++) {
    const current = [...entries][i];
    if (current.type === "in") {
      sessions.push({ date: current.date.split(",")[0], checkIn: current.time });
    } else if (current.type === "out") {
      const last = sessions[sessions.length - 1];
      if (last && !last.checkOut) {
        last.checkOut = current.time;
      } else {
        sessions.push({ date: current.date.split(",")[0], checkOut: current.time });
      }
    }
  }

  return (
    <div className="flex flex-col items-center justify-start w-full min-h-screen px-6 py-10 bg-blue-100 text-gray-800">
      <div className="w-full flex flex-col items-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight">
          Dashboard<span className="text-blue-600">_</span>
        </h1>
        <p className="mt-2 text-lg font-medium text-gray-600">{formattedDate}</p>
      </div>
      <div className="flex space-x-4 mb-8">
        <Button onClick={() => setStatus("in")} active={status === "in"} colorVariant="green">
          Check In
        </Button>
        <Button onClick={() => setStatus("out")} active={status === "out"} colorVariant="red">
          Check Out
        </Button>
      </div>
      {status === "in" && <p className="text-green-600 text-lg font-semibold mb-6">You are actually at work.</p>}
      {status === "out" && <p className="text-red-600 text-lg font-semibold mb-6">You are actually out of work.</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
        {sessions.map((session, index) => (
          <Card key={index} session={session} />
        ))}
      </div>
    </div>
  );
}
