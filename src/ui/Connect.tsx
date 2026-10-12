import { BrandMark } from "./BrandMark";

interface Props {
  onConnect: () => void;
}

export function Connect({ onConnect }: Props) {
  return (
    <section className="screen screen--centered">
      <BrandMark size={72} />
      <h1 className="brand">Odevah</h1>
      <button type="button" className="btn" onClick={onConnect}>
        Connect Spotify
      </button>
    </section>
  );
}
