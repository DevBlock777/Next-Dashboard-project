'use server';
import {z} from "zod";
import postgres from "postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { AuthError } from "next-auth";
import { User } from "./definitions";
import bcrypt from "bcrypt";

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' })

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({
      invalid_type_error: 'Please select a customer.'
    }),
    amount: z.coerce
    .number()
    .gt(0,{ message: 'Please enter an amount greater than $0.'}),
    status: z.enum(["pending",'paid'],{
      invalid_type_error: 'Please select an invoice status.'
    }),
    date: z.string()
})

const CreateInvoice = FormSchema.omit({id: true, date: true})

export async function createInvoice(prevState: State, formData: FormData) {
  //validate form using Zod
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if(!validatedFields.success){
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }
 
  // Prepare data for insertion into the database
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];
 
  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (error) {
    // We'll also log the error to the console for now
    console.error(error);
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }
 
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

const UpdateInvoice = FormSchema.omit({id: true, date: true})
export async function updateInvoice(id: string, prevSate: State, formData: FormData) {

  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if(!validatedFields.success){
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to update Invoice.',
    };
  }
  const {customerId, amount, status } =  validatedFields.data
  const amountInCents = amount * 100;
 
  try {
    await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}
      `;
  } catch (error) {
    // We'll also log the error to the console for now
    console.error(error);
    return { message: 'Database Error: Failed to Update Invoice.' };
  }
 
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
    // throw new Error('Failed to Delete Invoice');
  try {
     await sql`DELETE FROM invoices WHERE id = ${id}`;
  
  } catch (error) {
   console.log({error});
     return { message: 'Database Error: Failed to Delete Invoice.' };
  }
  revalidatePath('/dashboard/invoices');
 
}


export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
){
  try {
    await signIn("credentials",formData)
  } catch (error) {
    if(error instanceof AuthError){
       switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}


const UserSchema = z.object({
    id: z.string(),
    name: z.string({
      invalid_type_error: 'Please enter a name.'
    }),
    email: z.string({
      invalid_type_error: 'Please select an email.'
    }).email(),
    password: z.string({
      invalid_type_error: 'Please select a password min 8.'
    })
    .min(8)
    .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/,
    "Password must contain uppercase, lowercase, number and special character"
  )
})
const CreateUser = UserSchema.omit({id:true})

export type UserState = {
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
  };
  message?: string | null;
};
export async function register(
  prevState: string | undefined,
  formData: FormData,
){
 try {
    const validatedFields = CreateUser.safeParse({
      name: formData.get("name"),
  email: formData.get("email"),
  password: formData.get("password"),
    })

     if(!validatedFields.success){
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to create the user.',
    };
  }

  const {name,email, password} = validatedFields.data

    const user = await sql<User[]>`SELECT * FROM users WHERE email=${email}`;
    if(user.length > 0 ) return {
      message: "User already exists"
    }
    const passwordHash = await bcrypt.hash(password,10)
    try {
      await sql`
    INSERT INTO users(name,email,password) VALUES (${name},${email},${passwordHash})
    `
   console.log('bon try');
   
    } catch (error) {
      console.log("error")
      return{
        message: "Something went wrong"
      }
    }
    
  } catch (error) {
    console.error('Failed to create user:', error);
    throw new Error('Failed to create user.');
  }
   redirect("/login")
}