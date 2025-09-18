# OdataAsm-SE172360-Chapter04

This repository contains a project for exposing COVID-19 data through an OData API using .NET.

## Overview

The main goal of this project is to create a backend service that can serve COVID-19 data, allowing for flexible querying capabilities through the OData protocol.

## Project Structure

The repository is divided into two main parts:

-   `OdataAsm-SE172360-Chapter04.BE`: The .NET backend solution.
-   `OdataAsm-SE172360-Chapter04.FE`: A placeholder for the frontend application.

### Backend

The backend is a .NET web API project.

-   **Technology**: .NET
-   **Protocol**: OData
-   **Data Source**: The COVID-19 data is sourced from CSV files located in the `OdataAsm-SE172360-Chapter04.BE/OdataAsm-SE172360-Chapter04/Materials` directory. The primary data files are:
    -   `time_series_covid19_confirmed_global.csv`
    -   `time_series_covid19_deaths_global.csv`
    -   `time_series_covid19_recovered_global.csv`

### Frontend

The `OdataAsm-SE172360-Chapter04.FE` directory is intended for a frontend application that will consume the data from the OData API. This part of the project is not yet implemented.

## Getting Started

To get the backend up and running, you will need to have the .NET SDK installed.

1.  **Navigate to the backend project directory**:
    ```bash
    cd OdataAsm-SE172360-Chapter04.BE/OdataAsm-SE172360-Chapter04
    ```
2.  **Restore the dependencies**:
    ```bash
    dotnet restore
    ```
3.  **Run the project**:
    ```bash
    dotnet run
    ```
The API will be available at the URLs specified in the `launchSettings.json` file (typically `https://localhost:5001` and `http://localhost:5000`).

## Usage

Once the API is running, you can use OData query syntax to retrieve the data. For example, you can filter, sort, and select specific data fields directly through the URL.

Example OData queries:

-   `$select`: to specify which properties to include in the response.
-   `$filter`: to filter the results based on a condition.
-   `$orderby`: to sort the results.
-   `$top` and `$skip`: for pagination.

The exact OData endpoints will depend on the models exposed by the API.
