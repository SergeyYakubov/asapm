#!/bin/bash

# Requires sudo -H pip3 install sgqlc

sgqlc-codegen $1/graphql.schema.json schema.py
