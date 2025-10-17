import React from "react";

export type Entry = {
  id: number;
  date: string;
  time: string;
  type: "in" | "out";
};

export type Session = {
  date: string;
  checkIn?: string;
  checkOut?: string;
};

type CardProps = {
  session: Session;
};

export default function Card({ session }: CardProps) {
  return (
    <div className="bg-white shadow-md rounded-xl p-6 flex flex-col justify-center items-center hover:shadow-xl transition-all duration-300">
      <p className="text-sm text-gray-500 mb-2">{session.date}</p>

      {session.checkIn && (
        <p className="text-green-600 font-semibold">
          Check in: {session.checkIn}
        </p>
      )}
      {session.checkOut && (
        <p className="text-red-600 font-semibold mt-1">
          Check out: {session.checkOut}
        </p>
      )}
    </div>
  );
}