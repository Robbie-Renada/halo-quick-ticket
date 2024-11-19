import { useState } from "react";

function TicketForm() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const budgettime = new Date();
  budgettime.setHours(0, 0, 0, 0);
  const [timeBudget, setTimeBudget] = useState(budgettime);
  const [startDate, setStartDate] = useState(new Date());
  const [targetDate, setTargetDate] = useState(tomorrow);

  const formatDate = (date: Date): string => {
    return date.toISOString().split("T")[0];
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const HandleDateButton = (field: "start" | "target", offset: number) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    if (field === "start") {
      setStartDate(date);
    } else {
      setTargetDate(date);
    }
  };

  const HandleTimeButton = (hours: number) => {
    const time = new Date(timeBudget.getTime());
    time.setHours(hours);
    time.setMinutes(0);
    setTimeBudget(time);
  };

  const HandleAddTimeButton = (hours: number) => {
    const time = new Date(timeBudget.getTime());
    const minutesToAdd = hours * 60;
    time.setMinutes(time.getMinutes() + minutesToAdd);
    setTimeBudget(time);
  };

  return (
    <div className="w-full bg-white rounded-md shadow-md text-sm">
      <form className="flex flex-col space-y-4 p-4">
        <h1 className="text-lg font-semibold mb-0">Create a ticket</h1>
        <div>
          <label
            htmlFor="summary"
            className="block text-gray-700 text-xs font-bold pb-1"
          >
            Summary
          </label>
          <input
            type="text"
            tabIndex={1}
            id="summary"
            className="w-full bg-gray-50 rounded-md shadow-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 text-xs"
            placeholder="Brief Task Description"
          />
        </div>
        <div>
          <label
            htmlFor="details"
            className="block text-gray-700 text-xs font-bold pb-1"
          >
            Details
          </label>
          <textarea
            tabIndex={2}
            id="details"
            className="max-h-40 w-full bg-gray-50 rounded-md shadow-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 text-xs"
            placeholder="Additional Task Information"
          />
        </div>
        <div>
          <label
            htmlFor="timebudget"
            className="block text-gray-700 text-xs font-bold pb-1"
          >
            Time Budget
          </label>
          <input
            type="time"
            tabIndex={3}
            id="timebudget"
            className="w-full bg-gray-50 rounded-md shadow-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 text-xs"
            value={formatTime(timeBudget)}
            onChange={(e) => {
              const [hours, minutes] = e.target.value.split(":");
              const newTime = new Date(timeBudget);
              newTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
              setTimeBudget(newTime);
            }}
          />
          <div className="w-full flex pt-1 gap-2">
            <button
              type="button"
              className="bg-gray-200 text-gray-500 rounded-md shadow-sm text-[10px] w-1/3 hover:bg-gray-300"
              onClick={() => HandleAddTimeButton(0.25)}
            >
              + 15 Minutes
            </button>
            <button
              type="button"
              className="bg-gray-200 text-gray-500 rounded-md shadow-sm text-[10px] w-1/3 hover:bg-gray-300"
              onClick={() => HandleTimeButton(1)}
            >
              1 Hour
            </button>
            <button
              type="button"
              className="bg-gray-200 text-gray-500 rounded-md shadow-sm text-[10px] w-1/3 hover:bg-gray-300"
              onClick={() => HandleTimeButton(2)}
            >
              2 Hours
            </button>
          </div>
        </div>
        <div>
          <label
            htmlFor="startdate"
            className="block text-gray-700 text-xs font-bold pb-1"
          >
            Start Date
          </label>
          <input
            type="date"
            tabIndex={4}
            id="startdate"
            value={formatDate(startDate)}
            onChange={(e) => setStartDate(new Date(e.target.value))}
            className="w-full bg-gray-50 rounded-md shadow-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 text-xs"
          />
          <div className="w-full flex pt-1 gap-2">
            <button
              type="button"
              className="bg-gray-200 text-gray-500 rounded-md shadow-sm text-[10px] w-1/2 hover:bg-gray-300"
              onClick={() => HandleDateButton("start", 0)}
              value={formatDate(startDate)}
            >
              Today
            </button>
            <button
              type="button"
              className="bg-gray-200 text-gray-500 rounded-md shadow-sm text-[10px] w-1/2 hover:bg-gray-300"
              onClick={() => HandleDateButton("start", 1)}
              value={formatDate(startDate)}
            >
              Tomorrow
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="targetdate"
            className="block text-gray-700 text-xs font-bold pb-1"
          >
            Target Date
          </label>
          <input
            type="date"
            tabIndex={5}
            id="targetdate"
            value={formatDate(targetDate)}
            onChange={(e) => setTargetDate(new Date(e.target.value))}
            className="w-full bg-gray-50 rounded-md shadow-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 text-xs"
          />
          <div className="w-full flex pt-1 gap-2">
            <button
              type="button"
              className="bg-gray-200 text-gray-500 rounded-md shadow-sm text-[10px] w-1/2 hover:bg-gray-300"
              onClick={() => HandleDateButton("target", 0)}
              value={formatDate(targetDate)}
            >
              Today
            </button>
            <button
              type="button"
              className="bg-gray-200 text-gray-500 rounded-md shadow-sm text-[10px] w-1/2 hover:bg-gray-300"
              onClick={() => HandleDateButton("target", 1)}
              value={formatDate(targetDate)}
            >
              Tomorrow
            </button>
            <button
              type="button"
              className="bg-gray-200 text-gray-500 rounded-md shadow-sm text-[10px] w-1/2 hover:bg-gray-300"
              onClick={() => HandleDateButton("target", 7)}
              value={formatDate(targetDate)}
            >
              Next Week
            </button>
          </div>
        </div>
        <button
          type="submit"
          tabIndex={6}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-sm mt-2"
        >
          Create Task
        </button>
      </form>
    </div>
  );
}
export default TicketForm;
