import { UserRole } from '@src/types/auth';
import { isString } from 'jet-validators';
import { parseObject, TParseOnError } from 'jet-validators/utils';

// IModel might define an id or other properties.
// If IModel enforces a numeric ID or includes createdAt/updatedAt,
// IUser should not extend it or IModel should be adapted.
// For this modification, we'll assume IUser will define all its properties directly
// to match Prisma, excluding createdAt/updatedAt.
// import { IModel } from './common/types';


/******************************************************************************
                                 Constants
******************************************************************************/

// Default values for a user, reflecting the Prisma schema (excluding createdAt/updatedAt)
const DEFAULT_USER_VALS = (): IUser => ({
  id: '', // Prisma ID is String (UUID)
  firstName: '',
  lastName: '',
  email: '',
  password: '', // Include password in defaults, can be empty
});


/******************************************************************************
                                  Types
******************************************************************************/

// Align IUser with Prisma schema, excluding createdAt/updatedAt and orders relation
export interface IUser {
  id: string;  
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role?: UserRole;
}


/******************************************************************************
                                  Setup
******************************************************************************/

// Update parseUser to validate against the new IUser structure
const parseUser = parseObject<IUser>({
  id: isString, 
  firstName: isString,
  lastName: isString,
  email: isString,
  password: isString,
});


/******************************************************************************
                                 Functions
******************************************************************************/

/**
 * New user object.
 */
function newUser(user?: Partial<IUser>): IUser {
  // Spread default values first, then the partial user to override defaults
  const initialUser = { ...DEFAULT_USER_VALS(), ...user };

  // If an ID is provided in the partial, use it; otherwise, the default (empty string) remains.
  // Prisma handles actual UUID generation on database create.
  
  // Ensure password is handled correctly: if user object provides undefined for password,
  // and password is required in some contexts, this might need adjustment.
  // Here, if user.password is undefined, retVal.password will be DEFAULT_USER_VALS().password ('')
  // which is then validated by parseUser.
  
  return parseUser(initialUser, errors => {
    throw new Error('Setup new user failed ' + JSON.stringify(errors, null, 2));
  });
}

/**
 * Check if an object is a user object. For route validation or type guards.
 */
function testUser(arg: unknown, errCb?: TParseOnError): arg is IUser {
  return !!parseUser(arg, errCb);
}


/******************************************************************************
                                Export default
******************************************************************************/

export default {
  new: newUser,
  test: testUser,
} as const;