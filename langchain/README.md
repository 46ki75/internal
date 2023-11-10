# Langchain

Langchain is a web application designed for Python 3.10 and above.

## Activating the Poetry Environment

Before starting to work on the project, you should activate the `poetry` managed virtual environment. This ensures that you are using the correct versions of the dependencies for this project. To activate the environment, run:

```bash
poetry shell
```

This command will spawn a new shell subprocess, which has the virtual environment activated. You can now run Python scripts or commands within this environment.

If you're working on the project and want the dependencies to be installed in a way that allows you to make changes to the code and see the effects immediately (editable mode), `poetry` automatically manages this for you. No additional steps are required beyond the initial `poetry install`.

## Installation

To install the application, including its dependencies, run the following command in the project's root directory:

```bash
poetry install
```

This will install the dependencies specified in the `pyproject.toml` file within a managed virtual environment.

## Adding Dependencies

To add a new dependency to the project, use the `poetry add` command. For example, to add the `requests` library as a dependency, you would run the following command:

```bash
poetry add requests
```

This command will update the `pyproject.toml` file and the `poetry.lock` file, adding the `requests` library to your project dependencies. It will also install the `requests` library in the project's virtual environment.

Once you have added new dependencies with `poetry add`, they are automatically installed and available for your project. There is no need to run additional installation commands unless you are setting up the project afresh.

## Adding mypy path for VSCode

create `.vscode/setting.json` and setting path like this:

```json
{
  "mypy.dmypyExecutable": "/home/$USER/.cache/pypoetry/virtualenvs/<virtualenvName>/bin/mypy"
}
```
