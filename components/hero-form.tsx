"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { FormEvent, useState } from "react";
import { prepareDraftHandoff } from "@/lib/chat/draft-handoff";

const examples = [
  "Coffee shop in Sylhet",
  "Online boutique in Dhaka",
  "Agro supply store in Rajshahi",
];

export function HeroForm() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const value = idea.trim();
    if (value.length < 4) {
      setError("Tell us a little more about your business idea.");
      return;
    }
    if (!prepareDraftHandoff(value).ok) {
      setError(
        "Your browser could not carry the draft. Copy your idea, open /advisor, and paste it there.",
      );
      return;
    }
    router.push("/advisor");
  }

  return (
    <div>
      <form onSubmit={submit} className="mk-field-shell">
        <label htmlFor="business-idea" className="sr-only">
          Describe your business idea
        </label>
        <input
          id="business-idea"
          value={idea}
          maxLength={180}
          onChange={(e) => {
            setIdea(e.target.value);
            setError("");
          }}
          placeholder="e.g. I want to open a bakery in Dhaka"
          className="mk-input"
          aria-describedby={error ? "idea-error" : undefined}
        />
        <button className="mk-button" type="submit">
          Explore my idea{" "}
          <ArrowRight size={18} strokeWidth={2.5} aria-hidden="true" />
        </button>
      </form>
      {error && (
        <p id="idea-error" role="alert" className="mk-error">
          {error}
        </p>
      )}
      <div className="mk-hero-hints">
        <span className="mk-label">Try:</span>
        {examples.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => {
              setIdea(example);
              setError("");
            }}
            className="mk-chip"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
