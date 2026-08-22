export default function Logo({ className }) {
  return (
    <img
      src="/logo-transparent.png"
      alt="Vetri Digitals logo"
      className={`object-contain ${className ?? ""}`}
    />
  );
}
