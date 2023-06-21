# spyderacademy


To Run locally:

```
$ hugo server -D
```

To Deploy using Github Pages with Github Workflow, just commit and push your changes to the `main` branch.  Github Actions Workflow will trigger, and automatically deploy any merged changes into `main`.



## Creating a Blog Post

1.  Add a new folder to the `content > education` folder.  The folder should be lowercase, hyphenated for spaces, and reflect the title of the post (eg how-to-x, n-ways-to-do-x)
2.  Inside this new folder, add an `index.md` file. This is your blog post.  Copy one of the other existing ones for examples of what needs to go in there.  Main things is the front matter at the top should be configured.  Then the content is your stuff.
3.  Add a new subfolder named `images` to this new blog post folder you just created.  
4.  Inside this `images` folder, add your `cover.png` image.  This is the image that will be displayed on the list page to represent this post.
5.  If you have images inside your blog post, they should also be saved in this `images` folder.  You can reference them in your content using the `figure` template, using a relative path:

```
{{< figure class="floatleft" src="images/sorbet.png" >}}
```

6.  Save your post.  Then confirm it looks good locally by running your server locally.
