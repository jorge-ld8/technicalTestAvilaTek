import jetEnv, { num, str } from 'jet-env';
import { isEnumVal } from 'jet-validators';
import { NodeEnvs } from '.';

const ENV = jetEnv({
  NodeEnv: isEnumVal(NodeEnvs),
  Port: num,
  JwtSecret: str,
  RabbitmqUrl: str,
  DatabaseUrl: str,
});

export default ENV;
