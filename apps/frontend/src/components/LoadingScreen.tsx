export const LoadingScreen = (): JSX.Element => {
  return (
    <div className="app-loader">
      <div className="spinner" aria-hidden />
      <p>Loading workspace…</p>
    </div>
  );
};
