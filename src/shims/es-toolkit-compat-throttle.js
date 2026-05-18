// Shim for es-toolkit/compat/throttle - Recharts expects default export
import * as compat from "es-toolkit/compat";
export default compat.throttle;
export { throttle } from "es-toolkit/compat";
