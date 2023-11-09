# Langchain

Langchain is a web application designed for Python 3.10 and above.

## Installation

To install the application, including its dependencies, run the following command in the project's root directory:

```bash
pip install .
```

This will install the dependencies specified in the `pyproject.toml` file.

If you're working on the project and want to install the dependencies in an editable mode, which allows you to make changes to the code and see the effects immediately, you can use the following command:

```bash
pip install -e .
```

This command will also install the dependencies as specified in the `pyproject.toml`, but in a way that links directly to the source code in your project directory.

## Adding Dependencies

To add a new dependency to the project, you simply need to append it to the `dependencies` section in the `pyproject.toml` file. For example, to add the `requests` library as a dependency, you would include it like so:

```toml
dependencies = [
    "Flask",
    "requests",  # Add new dependencies here
    # Other project dependencies...
]
```

Once you have modified the `pyproject.toml` with your new dependencies, you can install them by running `pip install .` if not in editable mode, or `pip install -e .` if you are in editable mode. This will ensure that all new dependencies are installed and available for your project.
