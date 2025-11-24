export default function Head() {
  return (
    <>
      <link rel="manifest" href="/manifest.json" />
      <meta name="theme-color" content="#0ea5e9" />

      {/* Favicon and icons */}
      <link rel="icon" href="/balloons-icon.svg" />
      <link rel="shortcut icon" href="/balloons-icon.svg" />

      {/* Apple touch icon: for best compatibility provide a PNG under /public if possible */}
      <link rel="apple-touch-icon" href="/balloons-icon.svg" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    </>
  );
}
