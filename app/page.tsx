"use client";
import { useState } from "react";
import axios from "axios";
import { executeCode, modifyCode } from "./utils/codeExecutor";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
interface Message {
  type: "user" | "agent";
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Add user's input to the messages
    setMessages((prevMessages) => [
      ...prevMessages,
      { type: "user", content: userInput },
    ]);

    // Send the user's input to the Claude API
    const response = await axios.post<{ suggestedCode: string }>(
      "/api/claude",
      { message: userInput }
    );
    const { suggestedCode } = response.data;

    // Execute the suggested code and validate the output
    let executionResult = executeCode(suggestedCode);

    // If there are errors, modify the code and re-execute until successful
    while (executionResult.errors.length > 0) {
      const modifiedCode = modifyCode(suggestedCode, executionResult.errors);
      executionResult = executeCode(modifiedCode);
    }

    // Add the validated code to the messages
    setMessages((prevMessages) => [
      ...prevMessages,
      //{ type: "agent", content: executionResult.output },
      { type: "agent", content: suggestedCode },
    ]);

    // Clear the user input
    setUserInput("");
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-4">Chat with Claude</h1>
      <Card className="mb-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.type === "user" ? "justify-start" : "justify-end"
              }`}
            >
              <div
                className={`px-4 py-2 rounded-lg ${
                  message.type === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-800"
                } ${message.type === "agent" ? "ml-4" : ""}`}
              >
                {message.content}
              </div>
            </div>
          ))}
        </div>
      </Card>
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <Input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Enter your code snippet"
          className="flex-grow"
        />
        <Button type="submit">Send</Button>
      </form>
    </div>
  );
}
