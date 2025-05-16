import { z } from "zod";

const github_git_url_regex = /^(https:\/\/github\.com\/[\w.-]+\/[\w.-]+(\.git)?|git@github\.com:[\w.-]+\/[\w.-]+\.git)$/;

export const project_schema = z.object({
    project_name: z.string(),
    git_url: z.string().regex(github_git_url_regex, {
        message: "Invalid GitHub URL",
    }),
});
