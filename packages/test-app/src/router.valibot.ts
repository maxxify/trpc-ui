import { EventEmitter } from "node:events";
import { normalizeValidationErrors } from "@maxxify/trpc-ui";
import { initTRPC, TRPCError } from "@trpc/server";
import type * as trpcExpress from "@trpc/server/adapters/express";
import { observable } from "@trpc/server/observable";
import superjson from "superjson";
import * as v from "valibot";

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

const PostSchema = v.object({
  id: v.string(),
  text: v.string(),
});

type Post = v.InferOutput<typeof PostSchema>;

const UserSchema = v.object({
  id: v.string(),
  interests: v.array(v.string()),
  username: v.string(),
});

type User = v.InferOutput<typeof UserSchema>;

const IDSchema = v.object({
  id: v.string(),
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
  deleteUser: t.procedure.input(IDSchema).mutation(() => {
    return {
      message: "User deleted (not really)",
    };
  }),
  getAllUsers: t.procedure.query(() => {
    return [fakeData.user, fakeData.user, fakeData.user, fakeData.user];
  }),
  getUserById: t.procedure.input(IDSchema).query((_old) => {
    return fakeData.user;
  }),
  updateUser: t.procedure.input(UserSchema).mutation(({ input }) => {
    return input;
  }),
});

const postsRouter = t.router({
  createPost: t.procedure
    .input(
      v.object({
        text: v.string(),
      }),
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
  add: t.procedure.input(PostSchema).mutation(async ({ input }) => {
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

enum Fruits {
  Apple = "apple",
  Banana = "banana",
  Cherry = "cherry",
}

export const testRouterValibot = t.router({
  allInputs: t.procedure
    .input(
      v.object({
        boolean: v.boolean(),
        discriminatedUnion: v.variant("disc", [
          v.object({
            disc: v.literal("one"),
            oneProp: v.string(),
          }),
          v.object({
            disc: v.literal("two"),
            twoProp: v.picklist(["one", "two"]),
          }),
        ]),
        enum: v.picklist(["One", "Two"]),
        numberMin10: v.number(),
        obj: v.object({
          numberProperty: v.optional(v.number()),
          stringProperty: v.optional(v.string()),
        }),
        optionalEnum: v.optional(v.picklist(["Three", "Four"])),
        stringArray: v.array(v.string()),
        stringMin5: v.string(),
        stringOptional: v.optional(v.string()),
      }),
    )
    .query(({ input }) => ({ ...input })),

  anErrorThrowingRoute: t.procedure
    .input(
      v.object({
        ok: v.string(),
      }),
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
      v.object({
        userId: v.string(),
      }),
    )
    .input(
      v.object({
        organizationId: v.string(),
      }),
    )
    .input(
      v.object({
        postId: v.string(),
      }),
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
      .input(v.any())
      .query(({ input }) => input),
    discriminatedUnionInput: t.procedure
      .input(
        v.object({
          aDiscriminatedUnion: v.variant("discriminatedField", [
            v.object({
              aFieldThatOnlyShowsWhenValueIsOne: v.string(),
              discriminatedField: v.literal("One"),
            }),
            v.object({
              aFieldThatOnlyShowsWhenValueIsTwo: v.object({
                someTextFieldInAnObject: v.string(),
              }),
              discriminatedField: v.literal("Two"),
            }),
          ]),
        }),
      )
      .query(({ input }) => {
        return "It's an input";
      }),
    emailTextInput: t.procedure
      .input(
        v.object({
          email: v.string(),
        }),
      )
      .query(({ input }) => {
        return "It's good";
      }),
    enumInput: t.procedure
      .input(v.object({ aEnumInput: v.picklist(["One", "Two"]) }))
      .query(() => {
        return "It's an input";
      }),
    nativeEnumInput: t.procedure
      .input(v.object({ aNativeEnumInput: v.enum(Fruits) }))
      .query(({ input }) => {
        return { fruit: input.aNativeEnumInput };
      }),
    numberInput: t.procedure
      .input(v.object({ aNumberInput: v.number() }))
      .query(() => {
        return "It's an input";
      }),
    objectInput: t.procedure
      .input(
        v.object({
          anObject: v.object({
            numberArray: v.array(v.number()),
          }),
        }),
      )
      .query(() => {
        return "It's an input";
      }),
    stringArrayInput: t.procedure
      .input(v.object({ aStringArray: v.array(v.string()) }))
      .query(() => {
        return "It's an input";
      }),
    textInput: t.procedure
      .input(v.object({ aTextInput: v.string() }))
      .query(() => {
        return "It's an input";
      }),
    voidInput: t.procedure.input(v.undefined_()).query(() => {
      return "yep";
    }),
  }),
  nestedRouters: t.router(multiRouter),
  nonObjectInput: t.procedure
    .meta({
      description:
        'This input is just a string, not a property on an object.\n~~~ts\nt.procedure\n\t.meta({\n\t\tdescription: "...",\n\t})\n\t.input(z.string())\n\t.query(({ input }) => {\n\t\treturn `Your input was ${input}`;\n\t}),',
    })
    .input(v.string())
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
      v.object({
        id: v.string(),
        searchTerm: v.optional(v.string()),
      }),
    )
    .query(() => {
      return "Was that described well enough?";
    }),
  userRouter: userRouter,
});
