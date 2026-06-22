import { EventEmitter } from "node:events";
import { normalizeValidationErrors } from "@maxxify/trpc-ui";
import { initTRPC, TRPCError } from "@trpc/server";
import type * as trpcExpress from "@trpc/server/adapters/express";
import { observable } from "@trpc/server/observable";
import superjson from "superjson";
import * as yup from "yup";
import { yupInput } from "./yupWrapper.js";

type TRPCMeta = Record<string, unknown>;
type Meta<TMeta = TRPCMeta> = TMeta & {
  description?: string;
  cool?: string;
};
const t = initTRPC
  .context<ContextType>()
  .meta<Meta>()
  .create({
    errorFormatter({ shape, error }) {
      // Try to normalize validation errors for all validator types
      const normalizedErrors = normalizeValidationErrors(error.cause);
      return {
        ...shape,
        data: {
          ...shape.data,
          fieldErrors: normalizedErrors,
        },
      };
    },
    isServer: true,
    transformer: superjson,
  });

async function createContext(opts: trpcExpress.CreateExpressContextOptions) {
  const authHeader = opts.req.headers.authorization;
  const authorized = authHeader !== undefined && authHeader !== "";
  console.log("Request headers: ");
  console.log(authHeader);
  return {
    authorized: authorized,
  };
}

type ContextType = Awaited<ReturnType<typeof createContext>>;

const PostSchema = yup.object({
  id: yup.string().required(),
  text: yup.string().required(),
});

type Post = yup.InferType<typeof PostSchema>;

const UserSchema = yup.object({
  id: yup.string().required(),
  interests: yup.array(yup.string().required()).required(),
  username: yup.string().required(),
});

type User = yup.InferType<typeof UserSchema>;

const IDSchema = yup.object({
  id: yup.string().required(),
});

const fakeData: {
  user: User;
} = {
  user: {
    id: "f43cb448-1194-4528-80c7-b6f9287ad5fa",
    interests: [
      "type safety",
      "using 'as any'",
      "mindfulness meditation",
      "mcu movies",
    ],
    username: "trpclover47",
  },
};

const userRouter = t.router({
  deleteUser: t.procedure.input(yupInput(IDSchema)).mutation(() => {
    return {
      message: "User deleted (not really)",
    };
  }),
  getAllUsers: t.procedure.query(() => {
    return [fakeData.user, fakeData.user, fakeData.user, fakeData.user];
  }),
  getUserById: t.procedure.input(yupInput(IDSchema)).query((_old) => {
    return fakeData.user;
  }),
  updateUser: t.procedure.input(yupInput(UserSchema)).mutation(({ input }) => {
    return input;
  }),
});

const postsRouter = t.router({
  createPost: t.procedure
    .input(
      yupInput(
        yup.object({
          text: yup.string().required(),
        }),
      ),
    )
    .mutation(({ input }) => {
      return {
        id: "aoisdjfoasidjfasodf",
        text: input.text,
      };
    }),
  getAllPosts: t.procedure.query(() => {
    return [
      {
        id: "asodifjaosdf",
        text: "Post Id",
      },
      {
        id: "asodifjaosdf",
        text: "Post Id",
      },
      {
        id: "asodifjaosdf",
        text: "Post Id",
      },
    ];
  }),
});

const multiRouter = {
  postsRouter,
  userRouter,
};

// TODO unimplemented
const ee = new EventEmitter();
const _subscriptionRouter = t.router({
  add: t.procedure.input(yupInput(PostSchema)).mutation(async ({ input }) => {
    const post = { ...input }; /* [..] add to db */
    ee.emit("add", post);
    return post;
  }),
  onAdd: t.procedure.subscription(() => {
    // `resolve()` is triggered for each client when they start subscribing `onAdd`
    // return an `observable` with a callback which is triggered immediately
    return observable<Post>((emit) => {
      const onAdd = (data: Post) => {
        // emit data to client
        emit.next(data);
      };
      // trigger `onAdd()` when `add` is triggered in our event emitter
      ee.on("add", onAdd);
      // unsubscribe function when client disconnects or stops subscribing
      return () => {
        ee.off("add", onAdd);
      };
    });
  }),
});

const Fruits = ["apple", "banana", "cherry"] as const;

// Schema for allInputs procedure - uses yupInput wrapper for automatic validation
const allInputsSchema = yup.object({
  boolean: yup.boolean().required(),
  enum: yup.string().oneOf(["One", "Two"]).required(),
  numberMin10: yup.number().required(),
  obj: yup.object({
    numberProperty: yup.number(),
    stringProperty: yup.string(),
  }),
  optionalEnum: yup.string().oneOf(["Three", "Four"]),
  stringArray: yup.array(yup.string().required()).required(),
  stringMin5: yup.string().min(5).required(),
  stringOptional: yup.string(),
});

export const testRouterYup = t.router({
  allInputs: t.procedure.input(yupInput(allInputsSchema)).query(({ input }) => {
    return { ...input };
  }),

  anErrorThrowingRoute: t.procedure
    .input(
      yupInput(
        yup.object({
          ok: yup.string().required(),
        }),
      ),
    )
    .query(() => {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "It's pretty bad over here.",
      });
    }),
  authorizedProcedure: t.procedure
    .meta({
      description:
        'This procedure requires an "authorization" header to be set in the request. If it is not set, it will throw an "UNAUTHORIZED" error, and otherwise it will return "Authorized!"',
    })
    .mutation(({ ctx }) => {
      if (!ctx.authorized) throw new TRPCError({ code: "UNAUTHORIZED" });
      return "Authorized!";
    }),
  combinedInputs: t.procedure
    .meta({
      description:
        "tRPC ui now supports merged input validators. This use case makes creating composable procedures with middlewares easier. The three properties come from three septate .input() calls which automatically get merged into one zod validator. \n~~~ts\nt.procedure\n\t.input(\n\t\tz.object({\n\t\t\tuserId: z.string(),\n\t\t}),\n\t)\n\t.input(\n\t\tz.object({\n\t\t\torganizationId: z.string(),\n\t\t}),\n\t)\n\t.input(\n\t\tz.object({\n\t\t\tpostId: z.string(),\n\t\t}),\n\t)\n\t.query(({ input }) => {\n\t\treturn input;\n\t}),\n~~~\nThe above code generated this procedure.",
    })
    .input(
      yupInput(
        yup.object({
          userId: yup.string().required(),
        }),
      ),
    )
    .input(
      yupInput(
        yup.object({
          organizationId: yup.string().required(),
        }),
      ),
    )
    .input(
      yupInput(
        yup.object({
          postId: yup.string().required(),
        }),
      ),
    )
    .query(({ input }) => {
      return input;
    }),
  inputShowcaseRouter: t.router({
    any: t.procedure
      .meta({
        description:
          "This procedure has a zod 'any' input. No input components will display, but you can use the JSON editor in input any arbitrary JSON.",
      })
      .input(yup.mixed())
      .query(({ input }) => input),
    emailTextInput: t.procedure
      .input(
        yupInput(
          yup.object({
            email: yup.string().email().required(),
          }),
        ),
      )
      .query(({ input }) => {
        return "It's good";
      }),
    enumInput: t.procedure
      .input(
        yupInput(
          yup.object({
            aEnumInput: yup.string().oneOf(["One", "Two"]).required(),
          }),
        ),
      )
      .query(() => {
        return "It's an input";
      }),
    nativeEnumInput: t.procedure
      .input(
        yupInput(
          yup.object({
            aNativeEnumInput: yup
              .string()
              .oneOf([...Fruits])
              .required(),
          }),
        ),
      )
      .query(({ input }) => {
        return { fruit: input.aNativeEnumInput };
      }),
    numberInput: t.procedure
      .input(yupInput(yup.object({ aNumberInput: yup.number().required() })))
      .query(() => {
        return "It's an input";
      }),
    objectInput: t.procedure
      .input(
        yupInput(
          yup.object({
            anObject: yup.object({
              numberArray: yup.array(yup.number().required()).required(),
            }),
          }),
        ),
      )
      .query(() => {
        return "It's an input";
      }),
    stringArrayInput: t.procedure
      .input(
        yupInput(
          yup.object({
            aStringArray: yup.array(yup.string().required()).required(),
          }),
        ),
      )
      .query(() => {
        return "It's an input";
      }),
    textInput: t.procedure
      .input(
        yupInput(
          yup.object({
            aTextInput: yup.string().required(),
          }),
        ),
      )
      .query(() => {
        return "It's an input";
      }),
    voidInput: t.procedure.input(yup.object({})).query(() => {
      return "yep";
    }),
  }),
  nestedRouters: t.router(multiRouter),
  nonObjectInput: t.procedure
    .meta({
      description:
        'This input is just a string, not a property on an object.\n~~~ts\nt.procedure\n\t.meta({\n\t\tdescription: "...",\n\t})\n\t.input(z.string())\n\t.query(({ input }) => {\n\t\treturn `Your input was ${input}`;\n\t}),',
    })
    .input(yupInput(yup.string().required()))
    .query(({ input }) => {
      return `Your input was ${input}`;
    }),
  postsRouter: postsRouter,
  procedureWithDescription: t.procedure
    .meta({
      description:
        "# This is a description\n\nIt's a **good** one.\nIt may be overkill in certain situations, but procedures descriptions can render markdown thanks to [react-markdown](https://github.com/remarkjs/react-markdown) and [tailwindcss-typography](https://github.com/tailwindlabs/tailcss-typography)",
    })
    .input(
      yupInput(
        yup.object({
          id: yup.string().required(),
          searchTerm: yup.string(),
        }),
      ),
    )
    .query(() => {
      return "Was that described well enough?";
    }),
  userRouter: userRouter,
});
