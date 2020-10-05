#!/usr/bin/env python3

import pytoml

from os import makedirs
from os.path import dirname, join, exists

REDIRECT = "redirect.toml"
INDEX_PATH = "index"
INDEX_FILE = "index.html"

def attrlist(attributes):
    """
    Joined attributes for a HTML node
    """

    return "".join(
        [f" {name}=\"{value}\"" for name, value in attributes.items()],
    )

def node(name):
    """
    A single HTML node
    """
    node_name = name
    def _node(attributes={}, children=[]):
        attributes = attrlist(attributes)
        if len(children) > 0:
            children = "".join(children)
            return f"<{name}{attributes}>{children}</{name}>\n"
        else:
            return f"<{name}{attributes}/>\n"

    return _node


def bind(h, ha, name):
    element = node(name)
    setattr(h, name, lambda children: element({}, children))
    setattr(ha, name, element)

h = lambda: h
ha = lambda: ha
NODES = [
    "html", "head", "title", "meta", "body", "pre", "a", "ul", "li",
    "span",
]
for name in NODES:
    bind(h, ha, name)

def document(children = []):
    """
    A HTML document
    """

    root = h.html(children)
    return f"<!doctype html>\n\n{root}"

class Redirect:
    """
    A redirect from the redirect.toml
    """

    @staticmethod
    def load_all(data):
        redirects = {}

        for path, data in data.items():
            redirects[path] = Redirect(path, data)

        return redirects

    def __init__(self, path, data):
        self._path = path
        self._title = data["title"]
        self._url = data["url"]
        self._index = data["index"] if "index" in data else False

    @property
    def path(self):
        return self._path

    @property
    def title(self):
        return self._title

    @property
    def url(self):
        return self._url

    @property
    def index(self):
        return self._index

    def __repr__(self):
        return f"<{self.title}: {self.path} -> {self.url}>"

    @property
    def document(self):
        """
        Generate the redirect document
        """
        return document([
            h.head([
                ha.meta({"charset": "utf-8"}),
                ha.meta({
                    "http-equiv": "Refresh",
                    "content": f"0; url={self.url}",
                }),
                h.title([self.title]),
            ]),
            h.body([
                h.pre([
                    f"Redirecting to: {self.title}...",
                ]),
            ]),
        ])

    @property
    def link(self):
        """
        Generate a link for the document
        """
        return h.span([
            f"{self.path}: ",
            ha.a(
                {
                    "href": self.url,
                    "title": self.path,
                },
                [self.title],
            ),
        ])

def index(redirects):
    return document([
        h.head([
            ha.meta({ "charset": "utf-8" }),
            h.title(["xurtis.pw"]),
        ]),
        h.body([
            h.ul([
                h.li(r.link) for r in redirects if r.index
            ])
        ])
    ])

if __name__ == "__main__":
    redirects = Redirect.load_all(pytoml.load(open(REDIRECT)))

    for redirect in redirects.values():
        if not exists(redirect.path):
            makedirs(redirect.path)
        html_file = open(join(redirect.path, INDEX_FILE), "w")
        html_file.write(redirect.document)

    if not exists(INDEX_PATH):
        makedirs(INDEX_PATH)
    index_file = open(join(INDEX_PATH, INDEX_FILE), "w")
    index_file.write(index(redirects.values()))
