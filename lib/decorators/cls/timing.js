export function time(target, name, descriptor) {
  const original = descriptor.value;
  if (typeof original === 'function') {
    descriptor.value = async function(...args) {
      const start = new Date();
      try {
        console.debug(
          `Timing ${name}(${JSON.stringify(
            Array.prototype.slice.call(args, 0)
          )})`
        );
        return await original.apply(this, args);
      } catch (err) {
        console.debug(
          `Timing Error ${name}(${JSON.stringify(
            Array.prototype.slice.call(args, 0)
          )}): ${err.message}`
        );
        throw err;
      } finally {
        console.debug(
          `Timed ${name}(${JSON.stringify(
            Array.prototype.slice.call(args, 0)
          )}): Duration: ${new Date() - start}`
        );
      }
    };
  }

  return descriptor;
}
