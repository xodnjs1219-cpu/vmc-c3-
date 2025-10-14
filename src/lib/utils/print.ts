export const handlePrint = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.print();
};
