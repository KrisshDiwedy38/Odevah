import { useState } from "react";
import { setClientId } from "../auth/spotifyAuth";
import { BrandMark } from "./BrandMark";

interface Props {
  onSaved: () => void;
}

export function Onboarding({ onSaved }: Props) {
  const [value, setValue] = useState("");

  return (
    <section className="screen">
      <BrandMark size={52} />
      <div>
        <h1 className="title title--lg">Odevah</h1>
        <p className="body-text">
          Odevah runs on your own Spotify Client ID, kept in this browser only. Create a free app in your Spotify
          developer dashboard — the README covers the redirect URI to set — then paste the Client ID below.
        </p>
      </div>
      <div className="field">
        <label className="field-label" htmlFor="client-id">
          Spotify Client ID
        </label>
        <input
          id="client-id"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. 8f29a1c3d4b74e1a9c2f6b0e7d5a3c11"
        />
      </div>
      <button
        type="button"
        className="btn"
        disabled={!value.trim()}
        onClick={() => {
          setClientId(value);
          onSaved();
        }}
      >
        Save and continue
      </button>
    </section>
  );
}
